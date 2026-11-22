namespace CityBite.Api.Services;

/// <summary>
/// Saves uploaded photos under wwwroot/uploads/{folder}/ (works offline, no cloud service).
/// Returns the URL path, e.g. /uploads/dishes/3f2a....jpg — apps put http://LAPTOP-IP:5000 in front.
/// </summary>
public class ImageStorage(IWebHostEnvironment env)
{
    public const long MaxBytes = 5 * 1024 * 1024;
    private static readonly string[] Allowed = [".jpg", ".jpeg", ".png", ".webp"];

    public async Task<string> SaveAsync(IFormFile? file, string folder)
    {
        if (file == null || file.Length == 0) throw new ApiException(400, "Choose a photo to upload.");
        if (file.Length > MaxBytes) throw new ApiException(400, "Photo must be smaller than 5 MB.");

        string ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!Allowed.Contains(ext)) throw new ApiException(400, "Use a JPG, PNG or WEBP photo.");

        string dir = Path.Combine(env.WebRootPath, "uploads", folder);
        Directory.CreateDirectory(dir);
        string name = $"{Guid.NewGuid():N}{ext}";
        await using (var stream = File.Create(Path.Combine(dir, name)))
            await file.CopyToAsync(stream);
        return $"/uploads/{folder}/{name}";
    }

    /// <summary>Deletes an old uploaded photo (only files we stored under /uploads/, never demo images).</summary>
    public void Delete(string? url)
    {
        if (string.IsNullOrEmpty(url) || !url.StartsWith("/uploads/") || url.StartsWith("/uploads/demo/")) return;
        string path = Path.Combine(env.WebRootPath, url.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
        if (File.Exists(path)) File.Delete(path);
    }
}
