using Microsoft.EntityFrameworkCore.Infrastructure;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Library_Management_System.Data;
using Library_Management_System.Security;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Authentication.BearerToken;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Configuration;

namespace Library_Management_System.Tests;

public sealed class AuthorizationIntegrationTests : IClassFixture<StaffApiFactory>
{
    private readonly StaffApiFactory _factory;
    public AuthorizationIntegrationTests(StaffApiFactory factory) => _factory = factory;

    [Theory]
    [InlineData("/api/books")]
    [InlineData("/api/students")]
    [InlineData("/api/borrow/records")]
    [InlineData("/api/dashboard")]
    [InlineData("/api/contact")]
    [InlineData("/api/staff")]
    public async Task DirectAnonymousGet_IsUnauthorized(string path)
    {
        using var client = _factory.CreateClient();
        var response = await client.GetAsync(path);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task LibrarianDeniedAdminRoutes_AndAdminAllowed()
    {
        using var librarian = await _factory.AuthenticatedClientAsync("librarian@example.test", "Librarian");
        Assert.Equal(HttpStatusCode.Forbidden, (await librarian.GetAsync("/api/staff")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await librarian.GetAsync("/api/contact")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await librarian.GetAsync("/api/librarians")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await librarian.GetAsync("/api/books")).StatusCode);
        using var admin = await _factory.AuthenticatedClientAsync("admin@example.test", "Admin");
        Assert.Equal(HttpStatusCode.OK, (await admin.GetAsync("/api/staff")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await admin.GetAsync("/api/contact")).StatusCode);
    }

    [Fact]
    public async Task PublicRegistrationUnavailable_AndPayloadCannotEscalateRole()
    {
        using var anonymous = _factory.CreateClient();
        var register = await anonymous.PostAsJsonAsync("/api/auth/register", new { email = "visitor@example.test", password = "ComplexPassword!123", role = "Admin" });
        Assert.True(register.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.NotFound or HttpStatusCode.MethodNotAllowed);
        using var librarian = await _factory.AuthenticatedClientAsync("librarian@example.test", "Librarian");
        Assert.Equal(HttpStatusCode.Forbidden, (await librarian.PostAsJsonAsync("/api/staff", new { email = "evil@example.test", password = "ComplexPassword!123", role = "Admin" })).StatusCode);
        using var admin = await _factory.AuthenticatedClientAsync("admin@example.test", "Admin");
        var response = await admin.PostAsJsonAsync("/api/staff", new { email = "newlibrarian@example.test", password = "ComplexPassword!123", role = "Admin" });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<StaffResponse>();
        Assert.Equal("Librarian", created!.Role);
    }

    [Fact]
    public async Task InvalidAndRevokedBearerRejected()
    {
        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "invalid-token");
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/books")).StatusCode);
        using var admin = await _factory.AuthenticatedClientAsync("admin@example.test", "Admin");
        Assert.Equal(HttpStatusCode.NoContent, (await admin.PostAsync("/api/auth/logout", null)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await admin.GetAsync("/api/books")).StatusCode);
    }

    [Fact]
    public async Task ContactValidationAndStaffInputValidation()
    {
        using var client = _factory.CreateClient();
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/contact", new { name = "", email = "bad", subject = "", message = "" })).StatusCode);
        using var admin = await _factory.AuthenticatedClientAsync("admin@example.test", "Admin");
        Assert.Equal(HttpStatusCode.BadRequest, (await admin.PostAsJsonAsync("/api/staff", new { email = "bad", password = "short" })).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await admin.GetAsync("/api/students?page=0")).StatusCode);
        foreach (var path in new[] { "/api/borrow/records?page=0", "/api/borrow/records?pageSize=101", "/api/borrow/records?status=invalid", "/api/contact?page=0", "/api/contact?pageSize=101" })
        {
            var invalid = await admin.GetAsync(path);
            Assert.Equal(HttpStatusCode.BadRequest, invalid.StatusCode);
            Assert.Equal("application/problem+json", invalid.Content.Headers.ContentType?.MediaType);
        }
    }


    [Fact]
    public async Task LastActiveAdminCannotBeDisabledOrDemoted()
    {
        using var isolated = new StaffApiFactory();
        using var admin = await isolated.AuthenticatedClientAsync("sole-admin@example.test", "Admin");
        var accounts = await admin.GetFromJsonAsync<StaffResponse[]>("/api/staff");
        var id = Assert.Single(accounts!).Id;
        Assert.Equal(HttpStatusCode.Conflict, (await admin.PostAsync($"/api/staff/{id}/disable", null)).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await admin.PutAsJsonAsync($"/api/staff/{id}/role", new { role = "Librarian" })).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await admin.GetAsync("/api/staff")).StatusCode);
    }

    [Fact]
    public async Task ExpiredBearerIsRejected()
    {
        using var isolated = new ExpiringStaffApiFactory();
        using var admin = await isolated.AuthenticatedClientAsync("expiring-admin@example.test", "Admin");
        await Task.Delay(1300);
        Assert.Equal(HttpStatusCode.Unauthorized, (await admin.GetAsync("/api/books")).StatusCode);
    }


    [Fact]
    public async Task PasswordChangeRevokesOldToken_AndNewPasswordWorks()
    {
        using var isolated = new StaffApiFactory();
        using var admin = await isolated.AuthenticatedClientAsync("password-admin@example.test", "Admin");
        Assert.Equal(HttpStatusCode.NoContent, (await admin.PostAsJsonAsync("/api/auth/change-password",
            new { currentPassword = "ComplexPassword!123", newPassword = "ChangedPassword!456" })).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await admin.GetAsync("/api/books")).StatusCode);
        using var client = isolated.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync("/api/auth/login",
            new { email = "password-admin@example.test", password = "ComplexPassword!123" })).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.PostAsJsonAsync("/api/auth/login",
            new { email = "password-admin@example.test", password = "ChangedPassword!456" })).StatusCode);
    }

    [Fact]
    public async Task AdminCanDisableAndEnableLibrarian()
    {
        using var isolated = new StaffApiFactory();
        using var admin = await isolated.AuthenticatedClientAsync("account-admin@example.test", "Admin");
        using var librarian = await isolated.AuthenticatedClientAsync("account-librarian@example.test", "Librarian");
        var accounts = await admin.GetFromJsonAsync<StaffResponse[]>("/api/staff");
        var id = accounts!.Single(x => x.Role == "Librarian").Id;
        Assert.Equal(HttpStatusCode.NoContent, (await admin.PostAsync($"/api/staff/{id}/disable", null)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await librarian.GetAsync("/api/books")).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await admin.PostAsync($"/api/staff/{id}/enable", null)).StatusCode);
        using var fresh = await isolated.AuthenticatedClientAsync("account-librarian@example.test", "Librarian");
        Assert.Equal(HttpStatusCode.OK, (await fresh.GetAsync("/api/books")).StatusCode);
    }


    [Fact]
    public async Task NormalDevelopmentStartup_DoesNotProvisionAdministrator()
    {
        using var factory = new BootstrapConfiguredFactory();
        using var client = factory.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/books")).StatusCode);
        using var scope = factory.Services.CreateScope();
        Assert.Empty(await scope.ServiceProvider.GetRequiredService<UserManager<IdentityUser>>().Users.ToListAsync());
    }

    [Fact]
    public async Task ExplicitAdministratorBootstrapIsIdempotent()
    {
        using var isolated = new StaffApiFactory();
        using var client = isolated.CreateClient();
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["BootstrapAdmin:Enabled"] = "true",
            ["BootstrapAdmin:Email"] = "bootstrap@example.test",
            ["BootstrapAdmin:Password"] = "ComplexPassword!123"
        }).Build();
        await StaffSecurity.BootstrapAdminAsync(isolated.Services, config);
        var repeatConfig = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["BootstrapAdmin:Enabled"] = "true"
        }).Build();
        await StaffSecurity.BootstrapAdminAsync(isolated.Services, repeatConfig);
        using var scope = isolated.Services.CreateScope();
        var users = scope.ServiceProvider.GetRequiredService<UserManager<IdentityUser>>();
        var admin = await users.FindByEmailAsync("bootstrap@example.test");
        Assert.NotNull(admin);
        Assert.True(await users.IsInRoleAsync(admin, "Admin"));
        Assert.Single(await users.GetUsersInRoleAsync("Admin"));
    }


    [Fact]
    public async Task AccountWithoutStaffRoleCannotReceiveBearerToken()
    {
        using var isolated = new StaffApiFactory();
        using var client = isolated.CreateClient();
        using (var scope = isolated.Services.CreateScope())
        {
            var users = scope.ServiceProvider.GetRequiredService<UserManager<IdentityUser>>();
            Assert.True((await users.CreateAsync(new IdentityUser
            {
                UserName = "unroled@example.test", Email = "unroled@example.test", EmailConfirmed = true
            }, "ComplexPassword!123")).Succeeded);
        }
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync("/api/auth/login",
            new { email = "unroled@example.test", password = "ComplexPassword!123" })).StatusCode);
    }

    private sealed record StaffResponse(string Id, string Email, string Role);
}

public class StaffApiFactory : WebApplicationFactory<Program>
{
    private readonly string _databaseName = "staff-api-" + Guid.NewGuid().ToString("N");
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseSetting("ConnectionStrings:DefaultConnection", "Server=localhost;Database=UnusedTest;Trusted_Connection=True");
        builder.UseEnvironment("Testing");
        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<DbContextOptions<ApplicationDbContext>>();
            services.RemoveAll<IDbContextOptionsConfiguration<ApplicationDbContext>>();
            services.RemoveAll<ApplicationDbContext>();
            services.AddDbContext<ApplicationDbContext>(options => options.UseInMemoryDatabase(_databaseName));
        });
    }

    public async Task<HttpClient> AuthenticatedClientAsync(string email, string role)
    {
        using (var scope = Services.CreateScope())
        {
            var roles = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
            foreach (var name in new[] { StaffSecurity.AdminRole, StaffSecurity.LibrarianRole })
                if (!await roles.RoleExistsAsync(name)) await roles.CreateAsync(new IdentityRole(name));
            var users = scope.ServiceProvider.GetRequiredService<UserManager<IdentityUser>>();
            var user = await users.FindByEmailAsync(email);
            if (user is null)
            {
                user = new IdentityUser { UserName = email, Email = email, EmailConfirmed = true, LockoutEnabled = true };
                Assert.True((await users.CreateAsync(user, "ComplexPassword!123")).Succeeded);
                Assert.True((await users.AddToRoleAsync(user, role)).Succeeded);
            }
        }
        var client = CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/login", new { email, password = "ComplexPassword!123" });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var token = await response.Content.ReadFromJsonAsync<TokenResponse>();
        Assert.False(string.IsNullOrWhiteSpace(token?.AccessToken));
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token.AccessToken);
        return client;
    }
    private sealed record TokenResponse(string AccessToken);
}

public sealed class ExpiringStaffApiFactory : StaffApiFactory
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        base.ConfigureWebHost(builder);
        builder.ConfigureTestServices(services =>
            services.PostConfigure<BearerTokenOptions>(IdentityConstants.BearerScheme,
                options => options.BearerTokenExpiration = TimeSpan.FromSeconds(1)));
    }
}

public sealed class BootstrapConfiguredFactory : StaffApiFactory
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        base.ConfigureWebHost(builder);
        builder.UseEnvironment("Development");
        builder.UseSetting("SeedData:Enabled", "false");
        builder.UseSetting("BootstrapAdmin:Enabled", "true");
        builder.UseSetting("BootstrapAdmin:Email", "never-auto-provision@example.test");
        builder.UseSetting("BootstrapAdmin:Password", Convert.ToHexString(System.Security.Cryptography.RandomNumberGenerator.GetBytes(24)) + "Aa1!");
    }
}
