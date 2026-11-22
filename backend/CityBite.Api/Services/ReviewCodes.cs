using System.Security.Cryptography;

namespace CityBite.Api.Services;

/// <summary>6-character codes printed on bills. Leaves out 0/O and 1/I/L so they are easy to read and type.</summary>
public static class ReviewCodes
{
    private const string Alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    public const int Length = 6;

    public static string New()
    {
        Span<char> c = stackalloc char[Length];
        for (int i = 0; i < Length; i++) c[i] = Alphabet[RandomNumberGenerator.GetInt32(Alphabet.Length)];
        return new string(c);
    }

    /// <summary>Uppercases and removes spaces/dashes, so "k7m 4qx" matches "K7M4QX".</summary>
    public static string Normalize(string input) =>
        new string(input.Where(char.IsLetterOrDigit).ToArray()).ToUpperInvariant();
}
