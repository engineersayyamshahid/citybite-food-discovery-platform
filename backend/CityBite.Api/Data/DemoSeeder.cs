using CityBite.Api.Models;
using CityBite.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace CityBite.Api.Data;

/// <summary>
/// Fills an empty CityBite database with demo restaurants, dishes, customers, bills and reviews
/// so every screen has something to show. Run once:  dotnet run -- --seed-demo
/// (or pick the "seed-demo" profile in Visual Studio). Needs 02_Seed_Lookups.sql to have been run.
/// All demo accounts use the password: secret123
/// </summary>
public class DemoSeeder(AppDbContext db, RatingService ratings, ILogger<DemoSeeder> log)
{
    public const string DemoPassword = "secret123";
    private const string Img = "/uploads/demo/";
    private readonly Random rnd = new(42);   // fixed seed: same data every time

    private record DishSeed(string Name, string Category, string? FoodType, string Photo, string Desc,
                            double Quality, (string Label, decimal Price)[] Sizes, decimal Price = 0, bool Available = true);

    private record RestaurantSeed(string Name, string Area, string Address, string Owner, string Mobile, string Cover,
                                  string Desc, string[] Cuisines, DishSeed[] Dishes, bool FridayLate = false);

    public async Task SeedAsync()
    {
        if (await db.Restaurants.AnyAsync())
        {
            log.LogWarning("Demo seed skipped: the database already has restaurants.");
            return;
        }
        if (!await db.Areas.AnyAsync() || !await db.FoodTypes.AnyAsync())
            throw new InvalidOperationException("Run Database/02_Seed_Lookups.sql first (areas, cuisines, food types).");

        string hash = BCrypt.Net.BCrypt.HashPassword(DemoPassword);
        var areas = await db.Areas.ToDictionaryAsync(a => a.Name);
        var cuisines = await db.Cuisines.ToDictionaryAsync(c => c.Name);
        var foodTypes = await db.FoodTypes.ToDictionaryAsync(f => f.Name);

        // ---------- Restaurants, menus, hours ----------
        var allDishes = new List<(Dish Dish, double Quality)>();
        var restaurants = new List<Restaurant>();
        foreach (var rs in RestaurantData())
        {
            var owner = new User
            {
                Role = Roles.RestaurantOwner, FullName = rs.Name, Email = rs.Owner, Mobile = rs.Mobile,
                PasswordHash = hash, IsVerified = true, AreaId = areas[rs.Area].AreaId,
            };
            var r = new Restaurant
            {
                Owner = owner, Name = rs.Name, AreaId = areas[rs.Area].AreaId, Address = rs.Address,
                Description = rs.Desc, CoverPhotoUrl = Img + rs.Cover, LogoUrl = Img + rs.Cover, DineIn = true,
            };
            foreach (var c in rs.Cuisines) r.Cuisines.Add(cuisines[c]);

            int sort = 0;
            var cats = new Dictionary<string, Category>();
            foreach (var d in rs.Dishes)
            {
                if (!cats.TryGetValue(d.Category, out var cat))
                    r.Categories.Add(cats[d.Category] = cat = new Category { Name = d.Category, SortOrder = sort++ });

                var dish = new Dish
                {
                    Name = d.Name, Description = d.Desc, Category = cat,
                    FoodType = d.FoodType == null ? null : foodTypes[d.FoodType],
                    PhotoUrl = Img + d.Photo, IsAvailable = d.Available,
                    BasePrice = d.Sizes.Length > 0 ? d.Sizes.Min(s => s.Price) : d.Price,
                };
                foreach (var s in d.Sizes) dish.DishSizes.Add(new DishSize { Label = s.Label, Price = s.Price });
                r.Dishes.Add(dish);
                allDishes.Add((dish, d.Quality));
            }

            for (byte day = 1; day <= 7; day++)   // 1 = Monday ... 7 = Sunday
            {
                bool closed = day == 7 && rs.Name == "Tabaq Kitchen";
                r.OpeningHours.Add(new OpeningHour
                {
                    DayOfWeek = day, IsClosed = closed,
                    OpenTime = closed ? null : new TimeOnly(day == 5 && rs.FridayLate ? 14 : 11, 0),
                    CloseTime = closed ? null : new TimeOnly(0, 0),
                });
            }
            db.Restaurants.Add(r);
            restaurants.Add(r);
        }
        await db.SaveChangesAsync();

        // ---------- Customers ----------
        string[] names = ["Sana Tariq", "Ayesha Khan", "Hamza Raza", "Bilal Ahmed", "Usman Ali", "Fatima Noor", "Ali Hassan",
                          "Zainab Iqbal", "Hassan Javed", "Maryam Shah", "Omer Farooq", "Hira Aslam", "Saad Malik", "Amna Riaz", "Danish Qureshi"];
        var customers = names.Select((n, i) => new User
        {
            Role = Roles.Customer, FullName = n, PasswordHash = hash, IsVerified = true,
            Email = n.ToLowerInvariant().Replace(' ', '.') + "@citybite.demo",
            Mobile = "0300" + (1234567 + i).ToString(),
            AreaId = areas.Values.ElementAt(i % areas.Count).AreaId,
            CreatedAt = DateTime.UtcNow.AddDays(-90 + i),
        }).ToList();
        db.Users.AddRange(customers);
        await db.SaveChangesAsync();
        var sana = customers[0];

        // ---------- Bills, code uses, reviews ----------
        var usedCodes = new HashSet<string>();
        string NewCode() { string c; do c = ReviewCodes.New(); while (!usedCodes.Add(c)); return c; }

        foreach (var r in restaurants)
        {
            var menu = allDishes.Where(x => x.Dish.RestaurantId == r.RestaurantId && x.Dish.IsAvailable).ToList();
            int billNo = 10400;
            for (int b = 0; b < 24; b++)
            {
                var created = DateTime.UtcNow.AddDays(-rnd.Next(10, 60)).AddMinutes(-rnd.Next(0, 600));
                var bill = new Bill
                {
                    RestaurantId = r.RestaurantId, BillNo = ++billNo, TableNo = rnd.Next(1, 13),
                    ReviewCode = NewCode(), CreatedAt = created, CodeExpiresAt = created.AddDays(7), MaxReviewers = 4,
                };
                foreach (var (dish, _) in menu.OrderBy(_ => rnd.Next()).Take(rnd.Next(1, Math.Min(4, menu.Count) + 1)))
                {
                    var size = dish.DishSizes.Count > 0 ? dish.DishSizes.ElementAt(rnd.Next(dish.DishSizes.Count)) : null;
                    decimal price = size?.Price ?? dish.BasePrice;
                    int qty = rnd.Next(1, 4);
                    bill.BillItems.Add(new BillItem { DishId = dish.DishId, SizeId = size?.SizeId, Qty = qty, UnitPrice = price, LineTotal = price * qty });
                }
                bill.Total = bill.BillItems.Sum(i => i.LineTotal);
                db.Bills.Add(bill);
                await db.SaveChangesAsync();

                // 1-3 people from the table redeem the code and rate the dishes
                foreach (var cust in customers.OrderBy(_ => rnd.Next()).Take(rnd.Next(1, 4)))
                {
                    var when = created.AddHours(rnd.Next(1, 48));
                    db.CodeUses.Add(new CodeUse { BillId = bill.BillId, UserId = cust.UserId, RedeemedAt = when });
                    bill.UsedCount++;
                    foreach (var item in bill.BillItems)
                    {
                        if (rnd.NextDouble() < 0.2) continue;   // didn't rate every dish
                        double q = allDishes.First(x => x.Dish.DishId == item.DishId).Quality;
                        byte rating = (byte)Math.Clamp(Math.Round(q + (rnd.NextDouble() - 0.5) * 1.6), 1, 5);
                        var review = new Review
                        {
                            UserId = cust.UserId, BillItemId = item.BillItemId, DishId = item.DishId,
                            Rating = rating, Comment = rnd.NextDouble() < 0.7 ? Comment(rating) : null, CreatedAt = when,
                        };
                        if (rnd.NextDouble() < 0.18)
                            review.ReviewPhotos.Add(new ReviewPhoto { PhotoUrl = allDishes.First(x => x.Dish.DishId == item.DishId).Dish.PhotoUrl! });
                        db.Reviews.Add(review);
                    }
                }
                await db.SaveChangesAsync();
            }
        }

        // Two fresh, unused bills to try the review flow (codes K7M4QX and H4P9ZD)
        var tabaq = restaurants.First(r => r.Name == "Tabaq Kitchen");
        Dish D(string name) => allDishes.First(x => x.Dish.RestaurantId == tabaq.RestaurantId && x.Dish.Name == name).Dish;
        db.Bills.Add(DemoBill(tabaq, 10432, 2, "K7M4QX", (D("Chicken Karahi"), "Full", 1), (D("Garlic Naan"), null, 2)));
        db.Bills.Add(DemoBill(tabaq, 10444, 3, "H4P9ZD", (D("Chicken Karahi"), "Full", 2), (D("Garlic Naan"), null, 3), (D("Seekh Kabab"), null, 1)));

        // ---------- Promotion, favourites, taste picks ----------
        var milano = restaurants.First(r => r.Name == "Milano's Pizzeria");
        var home = await db.PromotionPackages.FirstAsync(p => p.Placement == "home");
        var today = DateOnly.FromDateTime(DateTime.Now);
        db.Promotions.Add(new Promotion
        {
            RestaurantId = milano.RestaurantId, PackageId = home.PackageId, DurationDays = 7,
            StartDate = today.AddDays(-1), EndDate = today.AddDays(5), AmountPaid = home.Price,
            Status = "active", Views = 4820, Taps = 312, Saves = 41,
        });

        Dish Find(string name) => allDishes.First(x => x.Dish.Name == name).Dish;
        db.FavoriteDishes.AddRange(
            new FavoriteDish { UserId = sana.UserId, DishId = D("Chicken Karahi").DishId },
            new FavoriteDish { UserId = sana.UserId, DishId = Find("Cheese Lovers Pizza").DishId },
            new FavoriteDish { UserId = sana.UserId, DishId = Find("Chocolate Fudge Cake").DishId });
        db.FavoriteRestaurants.AddRange(
            new FavoriteRestaurant { UserId = sana.UserId, RestaurantId = tabaq.RestaurantId },
            new FavoriteRestaurant { UserId = sana.UserId, RestaurantId = milano.RestaurantId });
        foreach (var ft in new[] { "Chicken Karahi", "Cheese Pizza", "Cake" }) sana.FoodTypes.Add(foodTypes[ft]);
        sana.AreaId = areas["Model Town"].AreaId;
        await db.SaveChangesAsync();

        await ratings.RecalculateAllAsync();

        log.LogWarning("Demo data ready: {R} restaurants, {D} dishes, {C} customers, {B} bills, {V} reviews. Password for all demo accounts: {P}",
            restaurants.Count, allDishes.Count, customers.Count, await db.Bills.CountAsync(), await db.Reviews.CountAsync(), DemoPassword);
    }

    private static Bill DemoBill(Restaurant r, int billNo, int table, string code, params (Dish Dish, string? Size, int Qty)[] items)
    {
        var bill = new Bill
        {
            RestaurantId = r.RestaurantId, BillNo = billNo, TableNo = table, ReviewCode = code,
            CreatedAt = DateTime.UtcNow.AddHours(-2), CodeExpiresAt = DateTime.UtcNow.AddDays(7), MaxReviewers = 4,
        };
        foreach (var (dish, sizeLabel, qty) in items)
        {
            var size = sizeLabel == null ? null : dish.DishSizes.First(s => s.Label.StartsWith(sizeLabel));
            decimal price = size?.Price ?? dish.BasePrice;
            bill.BillItems.Add(new BillItem { DishId = dish.DishId, SizeId = size?.SizeId, Qty = qty, UnitPrice = price, LineTotal = price * qty });
        }
        bill.Total = bill.BillItems.Sum(i => i.LineTotal);
        return bill;
    }

    private string Comment(byte rating)
    {
        string[] good = ["Best karahi in town, generous portion and served hot.", "Perfectly spiced. Will come back for this.",
                         "Fresh and full of flavour.", "Loved it, exactly as the photos show.", "Great taste and good value.",
                         "Smoky and juicy, highly recommended.", "One of the best I've had in Multan."];
        string[] ok = ["Good taste, service took a little longer than expected.", "Nice, but could use a bit more spice.",
                       "Decent portion, fair price.", "Good, not the best."];
        string[] bad = ["Too oily for me.", "Was cold when it reached the table.", "Not worth the price."];
        var pool = rating >= 5 ? good : rating >= 3 ? ok : bad;
        return pool[rnd.Next(pool.Length)];
    }

    private static (string, decimal)[] S(params (string, decimal)[] s) => s;
    private static readonly (string, decimal)[] None = [];

    private static IEnumerable<RestaurantSeed> RestaurantData() =>
    [
        new("Tabaq Kitchen", "Cantt", "Shop 4, Cantt Road, Multan", "tabaqkitchen@citybite.demo", "03007654321", "tabaq-kitchen.jpg",
            "Wood-fired karahi, fresh naan and smoky BBQ since 2015.", ["Desi", "BBQ"],
        [
            new("Chicken Karahi", "Karahi", "Chicken Karahi", "chicken-karahi.jpg", "Slow-cooked with tomatoes, green chili and fresh coriander.", 4.8, S(("Half (serves 1)", 500), ("Full (serves 2)", 850))),
            new("Beef Karahi", "Karahi", "Beef Karahi", "beef-karahi.jpg", "Tender beef in a rich tomato and ginger gravy.", 4.5, S(("Full (serves 2)", 950)), Available: false),
            new("Seekh Kabab", "BBQ", "Seekh Kabab", "seekh-kabab.jpg", "Charcoal-grilled minced beef skewers, 4 pieces.", 4.4, None, 700),
            new("Garlic Naan", "Breads", "Garlic Naan", "garlic-naan.jpg", "Fresh tandoori naan with garlic butter.", 4.7, None, 80),
            new("Mint Margarita", "Drinks", null, "drinks.jpg", "Chilled mint and lemon.", 4.3, None, 250),
        ], FridayLate: true),
        new("Spice Villa", "Gulgasht Colony", "12-B, Gulgasht Colony, Multan", "spicevilla@citybite.demo", "03007654322", "spice-villa.jpg",
            "Home-style desi food with a modern twist.", ["Desi"],
        [
            new("Chicken Karahi", "Karahi", "Chicken Karahi", "chicken-karahi.jpg", "Classic chicken karahi with black pepper.", 4.6, S(("Half (serves 1)", 450), ("Full (serves 2)", 800))),
            new("Mutton Karahi", "Karahi", "Mutton Karahi", "beef-karahi.jpg", "Bone-in mutton cooked in desi ghee.", 4.6, S(("Half (serves 1)", 1000), ("Full (serves 2)", 1800))),
            new("BBQ Chicken Pizza", "Pizza", "Tikka Pizza", "bbq-chicken-pizza.jpg", "Smoky chicken, onions and BBQ sauce.", 4.3, S(("Medium", 1050), ("Large", 1450))),
            new("Garlic Naan", "Breads", "Garlic Naan", "garlic-naan.jpg", "Butter and garlic naan.", 4.2, None, 70),
        ]),
        new("BBQ House", "Model Town", "45 Model Town, Multan", "bbqhouse@citybite.demo", "03007654323", "bbq-platter.jpg",
            "Charcoal BBQ platters and kababs.", ["BBQ", "Desi"],
        [
            new("Seekh Kabab", "BBQ", "Seekh Kabab", "seekh-kabab.jpg", "Juicy seekh kababs off the grill.", 4.6, None, 700),
            new("Beef Seekh Kabab", "BBQ", "Beef Seekh Kabab", "beef-seekh-kabab.jpg", "Spiced beef kababs with mint chutney.", 4.4, None, 780),
            new("Chicken Tikka", "BBQ", "Chicken Tikka", "bbq-platter.jpg", "Leg piece marinated overnight.", 4.3, None, 600),
            new("Chicken Karahi", "Karahi", "Chicken Karahi", "chicken-karahi.jpg", "Karahi made to order.", 4.3, S(("Half (serves 1)", 520), ("Full (serves 2)", 900))),
        ]),
        new("Milano's Pizzeria", "Model Town", "88 Model Town, Multan", "milanos@citybite.demo", "03007654324", "milanos-pizzeria.jpg",
            "Hand-stretched pizza baked to order.", ["Pizza", "Fast Food"],
        [
            new("Cheese Lovers Pizza", "Pizza", "Cheese Pizza", "cheese-pizza.jpg", "Four cheeses on a hand-stretched base, baked to order.", 4.8, S(("Small", 800), ("Medium", 1200), ("Large", 1600))),
            new("Pizza Margherita", "Pizza", "Margherita", "pizza-margherita.jpg", "Tomato, mozzarella and basil.", 4.5, S(("Small", 650), ("Medium", 950), ("Large", 1350))),
            new("Pepperoni Pizza", "Pizza", "Pepperoni Pizza", "pizza-slice-combo.jpg", "Loaded with beef pepperoni.", 4.4, S(("Medium", 1100), ("Large", 1500))),
        ]),
        new("Fast Bites", "Bosan Road", "Bosan Road, near Chowk Kumharanwala, Multan", "fastbites@citybite.demo", "03007654325", "burger.jpg",
            "Burgers, slices and quick bites.", ["Fast Food", "Pizza"],
        [
            new("Pizza Slice Combo", "Pizza", "Pepperoni Pizza", "pizza-slice-combo.jpg", "Two slices with a drink.", 4.1, None, 450),
            new("Beef Burger", "Burgers", "Beef Burger", "burger.jpg", "Double beef patty with cheese.", 4.2, None, 550),
            new("Zinger Burger", "Burgers", "Zinger Burger", "burger.jpg", "Crispy chicken fillet burger.", 4.0, None, 480),
        ]),
        new("Sweet House", "Mumtazabad", "Main Boulevard, Mumtazabad, Multan", "sweethouse@citybite.demo", "03007654326", "sweet-house.jpg",
            "Cakes, kheer and desi sweets.", ["Desserts", "Bakery"],
        [
            new("Chocolate Fudge Cake", "Cakes", "Cake", "chocolate-cake.jpg", "Rich chocolate fudge, served by the slice.", 4.7, None, 450),
            new("Kheer", "Desi Sweets", "Kheer", "dessert.jpg", "Slow-cooked rice pudding with pistachio.", 4.4, None, 250),
            new("Gulab Jamun", "Desi Sweets", "Gulab Jamun", "dessert.jpg", "Two warm gulab jamun.", 4.2, None, 200),
        ]),
        new("Desi Dhaba", "Shah Rukn-e-Alam", "Shah Rukn-e-Alam Colony, Multan", "desidhaba@citybite.demo", "03007654327", "chicken-karahi.jpg",
            "Roadside dhaba taste, family seating.", ["Desi"],
        [
            new("Chicken Karahi", "Karahi", "Chicken Karahi", "chicken-karahi.jpg", "Dhaba-style karahi.", 4.2, S(("Half (serves 1)", 560))),
            new("Beef Karahi", "Karahi", "Beef Karahi", "beef-karahi.jpg", "Beef karahi with fresh ginger.", 4.5, S(("Full (serves 2)", 900))),
            new("Roti", "Breads", "Roti", "garlic-naan.jpg", "Tandoori roti.", 4.0, None, 30),
        ]),
        new("Dragon Wok", "Cantt", "Abdali Road, Cantt, Multan", "dragonwok@citybite.demo", "03007654328", "chow-mein.jpg",
            "Pakistani-Chinese favourites.", ["Chinese"],
        [
            new("Chicken Chow Mein", "Noodles", "Chow Mein", "chow-mein.jpg", "Wok-tossed noodles with chicken and vegetables.", 4.4, S(("Regular", 650), ("Family", 1100))),
            new("Egg Fried Rice", "Rice", "Fried Rice", "chow-mein.jpg", "Fried rice with egg and spring onion.", 4.1, None, 600),
        ]),
    ];
}
