using Library_Management_System.Data;
using Library_Management_System.DTOs;
using Library_Management_System.Services;
using Microsoft.EntityFrameworkCore;

namespace Library_Management_System.Tests;

public sealed class StudentServiceTests
{
    [Theory]
    [InlineData("not-an-email", "REG-1")]
    [InlineData("student@example.test", "   ")]
    public async Task RegistrationRejectsInvalidEmailOrBlankNumber(string email, string registrationNumber)
    {
        await using var db = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
        var service = new StudentService(db);
        await Assert.ThrowsAsync<ArgumentException>(() => service.CreateAsync(new StudentRequestDto
        {
            StudentName = "Student", Email = email, Phone = "123", RegistrationNumber = registrationNumber
        }, CancellationToken.None));
        Assert.Empty(db.Students);
    }
}
