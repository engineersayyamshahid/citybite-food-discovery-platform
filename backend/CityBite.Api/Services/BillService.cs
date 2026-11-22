using CityBite.Api.Data;
using CityBite.Api.DTOs;
using CityBite.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CityBite.Api.Services;

/// <summary>
/// Bills are calculated here, on the server: the app sends dish IDs, sizes and quantities,
/// and prices come from the database. Also generates the bill number and the review code.
/// </summary>
public class BillService(AppDbContext db)
{
    public const int CodeValidDays = 7;
    public const byte MaxReviewersPerBill = 4;
    private const int FirstBillNo = 10001;

    public async Task<BillDto> CreateAsync(int restaurantId, CreateBillRequest req)
    {
        // Merge repeated lines (same dish + size) so the bill stays tidy.
        var lines = req.Items
            .GroupBy(i => (i.DishId, i.SizeId))
            .Select(g => new { g.Key.DishId, g.Key.SizeId, Qty = g.Sum(x => x.Qty) })
            .ToList();

        var dishIds = lines.Select(l => l.DishId).Distinct().ToList();
        var dishes = await db.Dishes.Include(d => d.DishSizes)
            .Where(d => dishIds.Contains(d.DishId) && d.RestaurantId == restaurantId)
            .ToDictionaryAsync(d => d.DishId);

        var bill = new Bill
        {
            RestaurantId = restaurantId,
            TableNo = req.TableNo,
            CreatedAt = DateTime.UtcNow,
            CodeExpiresAt = DateTime.UtcNow.AddDays(CodeValidDays),
            MaxReviewers = MaxReviewersPerBill,
        };

        foreach (var line in lines)
        {
            if (!dishes.TryGetValue(line.DishId, out var dish))
                throw new ApiException(400, $"Dish {line.DishId} is not on your menu.");
            if (!dish.IsAvailable)
                throw new ApiException(400, $"{dish.Name} is marked Not available. Turn it on in your menu first.");

            decimal price;
            if (dish.DishSizes.Count > 0)
            {
                if (line.SizeId == null)
                    throw new ApiException(400, $"Choose a size for {dish.Name}.");
                var size = dish.DishSizes.FirstOrDefault(s => s.SizeId == line.SizeId)
                           ?? throw new ApiException(400, $"That size does not belong to {dish.Name}.");
                price = size.Price;
            }
            else
            {
                if (line.SizeId != null) throw new ApiException(400, $"{dish.Name} has no sizes.");
                price = dish.BasePrice;
            }

            bill.BillItems.Add(new BillItem
            {
                DishId = dish.DishId, SizeId = line.SizeId, Qty = line.Qty,
                UnitPrice = price, LineTotal = price * line.Qty,
            });
        }

        bill.Total = bill.BillItems.Sum(i => i.LineTotal);
        bill.BillNo = (await db.Bills.Where(b => b.RestaurantId == restaurantId).MaxAsync(b => (int?)b.BillNo) ?? FirstBillNo - 1) + 1;
        bill.ReviewCode = await NewUniqueCodeAsync();

        db.Bills.Add(bill);
        await db.SaveChangesAsync();
        return (await GetAsync(restaurantId, bill.BillId))!;
    }

    public async Task<BillDto?> GetAsync(int restaurantId, int billId)
    {
        var b = await db.Bills
            .Include(x => x.Restaurant)
            .Include(x => x.BillItems).ThenInclude(i => i.Dish)
            .Include(x => x.BillItems).ThenInclude(i => i.Size)
            .AsSplitQuery()
            .FirstOrDefaultAsync(x => x.BillId == billId && x.RestaurantId == restaurantId);
        if (b == null) return null;

        return new BillDto(b.BillId, b.BillNo, b.TableNo, b.Restaurant.Name, b.Restaurant.Address, b.CreatedAt,
            b.BillItems.OrderBy(i => i.BillItemId)
                .Select(i => new BillItemDto(i.BillItemId, i.DishId, i.Dish.Name, i.Size?.Label, i.Qty, i.UnitPrice, i.LineTotal))
                .ToList(),
            b.Total, b.ReviewCode, b.CodeExpiresAt, b.UsedCount, b.MaxReviewers);
    }

    private async Task<string> NewUniqueCodeAsync()
    {
        for (int i = 0; i < 20; i++)
        {
            string code = ReviewCodes.New();
            if (!await db.Bills.AnyAsync(b => b.ReviewCode == code)) return code;
        }
        throw new ApiException(500, "Could not create a review code. Try again.");
    }
}
