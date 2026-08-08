using CampusStore.Application.ApplicationServices;

namespace CampusStore.UnitTests.Application;

public sealed class SlugServiceTests
{
    [Theory]
    [InlineData("Đèn bàn học", "den-ban-hoc")]
    [InlineData("  Bút bi xanh 0.5mm  ", "but-bi-xanh-0-5mm")]
    [InlineData("CampusStore -- Student Pack", "campusstore-student-pack")]
    public void Slugify_ReturnsAsciiUrlSlug(string value, string expected)
    {
        Assert.Equal(expected, SlugService.Slugify(value));
    }
}
