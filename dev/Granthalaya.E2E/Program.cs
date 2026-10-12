using Library_Management_System.Data;
using Library_Management_System.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Text.RegularExpressions;

if (!OperatingSystem.IsLinux()) throw new PlatformNotSupportedException("The local E2E runner supports Linux.");

var name = Environment.GetEnvironmentVariable("GRANTHALAYA_E2E_DB") ?? "";
if (!Regex.IsMatch(name, "^Granthalaya_E2E_[a-f0-9]{32}$"))
    throw new InvalidOperationException("Refusing database operation: expected a generated Granthalaya_E2E_ database name.");
var server = Environment.GetEnvironmentVariable("GRANTHALAYA_TEST_SQL_CONNECTION")
    ?? throw new InvalidOperationException("Set GRANTHALAYA_TEST_SQL_CONNECTION; no development connection is used.");
var connection = new SqlConnectionStringBuilder(server) { InitialCatalog = name, Pooling = false }.ConnectionString;
var services = new ServiceCollection();
services.AddLogging(builder => builder.SetMinimumLevel(LogLevel.Warning));
services.AddDbContext<ApplicationDbContext>(options => options.UseSqlServer(connection));
services.AddIdentityCore<IdentityUser>(options => {
    options.Password.RequiredLength = 12;
    options.User.RequireUniqueEmail = true;
}).AddRoles<IdentityRole>().AddEntityFrameworkStores<ApplicationDbContext>();
await using var provider = services.BuildServiceProvider();
await using var scope = provider.CreateAsyncScope();
var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
var ownerFile = Environment.GetEnvironmentVariable("GRANTHALAYA_E2E_OWNER_FILE")
    ?? throw new InvalidOperationException("Runner must supply an ownership marker path.");
if (args is ["cleanup"]) {
    if (!File.Exists(ownerFile)) { Console.WriteLine("No database owned by this run requires cleanup."); return; }
    if (await File.ReadAllTextAsync(ownerFile) != name) throw new InvalidOperationException("Database ownership marker mismatch.");
    await db.Database.EnsureDeletedAsync();
    File.Delete(ownerFile);
    Console.WriteLine("Disposable E2E database removed.");
    return;
}
if (args is not ["prepare"]) throw new ArgumentException("Use prepare or cleanup.");
if (await db.Database.CanConnectAsync()) throw new InvalidOperationException("Refusing to reuse an existing E2E database.");
await using (var marker = new FileStream(ownerFile, new FileStreamOptions
{ Mode = FileMode.CreateNew, Access = FileAccess.Write, UnixCreateMode = UnixFileMode.UserRead | UnixFileMode.UserWrite }))
await using (var writer = new StreamWriter(marker)) await writer.WriteAsync(name);
await db.Database.MigrateAsync();
var password = Environment.GetEnvironmentVariable("GRANTHALAYA_E2E_PASSWORD")
    ?? throw new InvalidOperationException("Runner must supply generated account credentials.");
var roles = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
var users = scope.ServiceProvider.GetRequiredService<UserManager<IdentityUser>>();
foreach (var role in new[] { "Admin", "Librarian" }) {
    if (!(await roles.CreateAsync(new IdentityRole(role))).Succeeded) throw new InvalidOperationException("Test role creation failed.");
    // The runner provisions the Admin through the application's real --bootstrap-admin CLI.
    if (role == "Admin") continue;
    var email = "demo.librarian@example.test";
    var user = new IdentityUser { UserName = email, Email = email, EmailConfirmed = true, LockoutEnabled = true };
    if (!(await users.CreateAsync(user, password)).Succeeded || !(await users.AddToRoleAsync(user, role)).Succeeded)
        throw new InvalidOperationException("Test account creation failed.");
}
var student = new Student { StudentName = "Demo Reader", RegistrationNumber = "DEMO-001", Email = "reader@example.test", Phone = "0000000000", Gender = "Other", Address = "Demonstration records" };
db.Students.Add(student);
var titles = new[] { "Clean Code", "Database Systems", "Designing Data Applications", "Introduction to Algorithms", "Operating Systems", "Computer Networks", "Software Engineering" };
var now = DateTime.UtcNow;
for (var i = 0; i < titles.Length; i++) {
    var book = new Book { Title = titles[i], Author = "Demo Author", ISBN = $"DEMO-ISBN-{i + 1}", Genre = i % 2 == 0 ? "Software" : "Computing", PublicationYear = 2024, Publisher = "Demo Press", Description = "Neutral portfolio demonstration data." };
    var copy = new BookCopy { Book = book, AccessionNumber = $"DEMO-COPY-{i + 1:000}", Condition = "Good" };
    db.BookCopies.Add(copy);
    db.BorrowRecords.Add(new BorrowRecord { Student = student, BookCopy = copy, BorrowDate = now.AddDays(-20 - i), DueDate = now.AddDays(i % 2 == 0 ? -2 : 7), ReturnDate = i < 4 ? now.AddDays(-1) : null });
    db.ContactMessages.Add(new ContactMessage { Name = "Demo Reader", Email = "reader@example.test", Subject = $"Catalog inquiry {i + 1}", Message = "Please review this demonstration inquiry.", SubmittedAt = now.AddMinutes(-i) });
}
db.BookCopies.Add(new BookCopy { Book = new Book { Title = "Practical TypeScript", Author = "Demo Author", ISBN = "DEMO-ISBN-8", Genre = "Software", PublicationYear = 2025, Publisher = "Demo Press" }, AccessionNumber = "DEMO-COPY-008", Condition = "Good" });
db.Librarians.Add(new Librarian { Name = "Demo Librarian", Age = 30, Phone = "0000000000" });
db.Publications.Add(new Publication { Title = "Local Science Review", Publisher = "Demo Press", PublishedDate = new DateTime(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc), Type = PublicationType.Magazine, IsAvailable = true });
await db.SaveChangesAsync();
var connectionFile = Environment.GetEnvironmentVariable("GRANTHALAYA_E2E_CONNECTION_FILE")
    ?? throw new InvalidOperationException("Runner must supply a private connection file path.");
await using (var file = new FileStream(connectionFile, new FileStreamOptions
{
    Mode = FileMode.CreateNew, Access = FileAccess.Write, UnixCreateMode = UnixFileMode.UserRead | UnixFileMode.UserWrite
}))
await using (var writer = new StreamWriter(file)) await writer.WriteAsync(connection);
Console.WriteLine("Disposable E2E database migrated and neutral records prepared.");
