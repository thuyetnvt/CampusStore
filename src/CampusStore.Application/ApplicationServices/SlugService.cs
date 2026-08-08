using System.Globalization;
using System.Text;

namespace CampusStore.Application.ApplicationServices;

public static class SlugService
{
    public static string Slugify(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var slug = RemoveDiacritics(value.Trim().ToLowerInvariant());
        slug = new string(slug.Select(c => char.IsLetterOrDigit(c) ? c : '-').ToArray());

        while (slug.Contains("--", StringComparison.Ordinal))
        {
            slug = slug.Replace("--", "-", StringComparison.Ordinal);
        }

        return slug.Trim('-');
    }

    private static string RemoveDiacritics(string value)
    {
        var normalized = value.Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(capacity: normalized.Length);

        foreach (var character in normalized)
        {
            var category = CharUnicodeInfo.GetUnicodeCategory(character);
            if (category != UnicodeCategory.NonSpacingMark)
            {
                builder.Append(character == 'đ' ? 'd' : character);
            }
        }

        return builder.ToString().Normalize(NormalizationForm.FormC);
    }
}
