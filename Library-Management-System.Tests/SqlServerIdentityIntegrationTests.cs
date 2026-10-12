using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Library_Management_System.Data;
using Library_Management_System.Security;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authentication.BearerToken;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Library_Management_System.Tests;

public sealed class SqlServerIdentityIntegrationTests
{
    private const string AdminEmail = "batch3-admin@example.test";
    private const string AdminPassword = "Granthalaya-Test!Password-100";

    [SqlServerFact]
    public async Task NaturalTokenExpiration_WithShortTestLifetime_IsRejectedBySqlBackedApi()
    {
        var connection = new Microsoft.Data.SqlClient.SqlConnectionStringBuilder(Environment.GetEnvironmentVariable("GRANTHALAYA_TEST_SQL_CONNECTION"))
        { InitialCatalog = "Granthalaya_Identity_Test_" + Guid.NewGuid().ToString("N"), Pooling = false }.ConnectionString;
        try
        {
            using var server = new SqlServerApiFactory(connection, TimeSpan.FromSeconds(1));
            using var anonymous = server.CreateClient();
            await using (var scope = server.Services.CreateAsyncScope())
                await scope.ServiceProvider.GetRequiredService<ApplicationDbContext>().Database.MigrateAsync();
            var password = Convert.ToHexString(System.Security.Cryptography.RandomNumberGenerator.GetBytes(24)) + "Aa1!";
            await StaffSecurity.BootstrapAdminAsync(server.Services, new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["BootstrapAdmin:Enabled"] = "true", ["BootstrapAdmin:Email"] = "expiry@example.test", ["BootstrapAdmin:Password"] = password
            }).Build());
            using var client = await LoginAsync(server, "expiry@example.test", password);
            Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/auth/me")).StatusCode);
            await Task.Delay(TimeSpan.FromMilliseconds(1300)); // Actual one-second ticket lifetime plus scheduler margin.
            var expired = await client.GetAsync("/api/auth/me");
            Assert.Equal(HttpStatusCode.Unauthorized, expired.StatusCode);
            Assert.Equal("application/problem+json", expired.Content.Headers.ContentType?.MediaType);
        }
        finally
        {
            await using var cleanup = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>().UseSqlServer(connection).Options);
            await cleanup.Database.EnsureDeletedAsync();
        }
    }

    [SqlServerFact]
    public async Task IdentityPersistenceRolesAndImmediateRevocation_WorkAgainstSqlServer()
    {
        var baseConnection = Environment.GetEnvironmentVariable("GRANTHALAYA_TEST_SQL_CONNECTION")!;
        var connection = new Microsoft.Data.SqlClient.SqlConnectionStringBuilder(baseConnection)
        {
            InitialCatalog = "Granthalaya_Identity_Test_" + Guid.NewGuid().ToString("N"),
            Pooling = false
        }.ConnectionString;

        try
        {
            using var firstServer = new SqlServerApiFactory(connection);
            using (var anonymous = firstServer.CreateClient())
            {
                await using var scope = firstServer.Services.CreateAsyncScope();
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                await db.Database.MigrateAsync();
                var bootstrapConfig = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["BootstrapAdmin:Enabled"] = "true",
                    ["BootstrapAdmin:Email"] = AdminEmail,
                    ["BootstrapAdmin:Password"] = AdminPassword
                }).Build();
                await StaffSecurity.BootstrapAdminAsync(firstServer.Services, bootstrapConfig);

                Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.GetAsync("/api/books")).StatusCode);
                var selfRegistration = await anonymous.PostAsJsonAsync("/api/auth/register", new
                {
                    email = "external@example.test", password = "Granthalaya-Test!Password-100", role = "Admin"
                });
                Assert.Equal(HttpStatusCode.Unauthorized, selfRegistration.StatusCode);

                var admin = await LoginAsync(firstServer, AdminEmail, AdminPassword);
                var adminProfile = await admin.GetFromJsonAsync<StaffProfileDto>("/api/auth/me");
                Assert.Equal("Admin", adminProfile!.Role);
                var createLibrarian = await admin.PostAsJsonAsync("/api/staff", new
                {
                    email = "batch3-librarian@example.test", password = "Granthalaya-Test!Password-200", role = "Admin"
                });
                Assert.Equal(HttpStatusCode.Created, createLibrarian.StatusCode);
                var librarian = await LoginAsync(firstServer, "batch3-librarian@example.test", "Granthalaya-Test!Password-200");
                Assert.Equal(HttpStatusCode.OK, (await librarian.GetAsync("/api/books")).StatusCode);
                Assert.Equal(HttpStatusCode.Forbidden, (await librarian.GetAsync("/api/staff")).StatusCode);

                var accounts = await admin.GetFromJsonAsync<StaffProfileDto[]>("/api/staff");
                var libAccount = accounts!.Single(x => x.Email == "batch3-librarian@example.test");
                Assert.Equal(HttpStatusCode.NoContent, (await admin.PostAsync($"/api/staff/{libAccount.Id}/disable", null)).StatusCode);
                Assert.Equal(HttpStatusCode.Unauthorized, (await librarian.GetAsync("/api/books")).StatusCode);
                Assert.Equal(HttpStatusCode.NoContent, (await admin.PostAsync($"/api/staff/{libAccount.Id}/enable", null)).StatusCode);

                librarian.Dispose();
                librarian = await LoginAsync(firstServer, "batch3-librarian@example.test", "Granthalaya-Test!Password-200");
                Assert.Equal(HttpStatusCode.OK, (await admin.PutAsJsonAsync($"/api/staff/{libAccount.Id}/role", new { role = "Admin" })).StatusCode);
                Assert.Equal(HttpStatusCode.Unauthorized, (await librarian.GetAsync("/api/books")).StatusCode);
                librarian.Dispose();
                librarian = await LoginAsync(firstServer, "batch3-librarian@example.test", "Granthalaya-Test!Password-200");
                Assert.Equal("Admin", (await librarian.GetFromJsonAsync<StaffProfileDto>("/api/auth/me"))!.Role);

                Assert.Equal(HttpStatusCode.NoContent, (await admin.PostAsJsonAsync("/api/auth/change-password", new
                {
                    currentPassword = AdminPassword, newPassword = "Granthalaya-Test!Password-101"
                })).StatusCode);
                Assert.Equal(HttpStatusCode.Unauthorized, (await admin.GetAsync("/api/books")).StatusCode);
                admin.Dispose();
                admin = await LoginAsync(firstServer, AdminEmail, "Granthalaya-Test!Password-101");
                Assert.Equal(HttpStatusCode.NoContent, (await admin.PostAsync("/api/auth/logout", null)).StatusCode);
                Assert.Equal(HttpStatusCode.Unauthorized, (await admin.GetAsync("/api/books")).StatusCode);
                librarian.Dispose();
                admin.Dispose();
            }

            // Recreate the server against the same database to verify Identity persistence across restart.
            using var restartedServer = new SqlServerApiFactory(connection);
            using var restartedClient = restartedServer.CreateClient();
            await using (var scope = restartedServer.Services.CreateAsyncScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                await db.Database.MigrateAsync();
            }
            using var signedInAfterRestart = await LoginAsync(restartedServer, AdminEmail, "Granthalaya-Test!Password-101");
            Assert.Equal("Admin", (await signedInAfterRestart.GetFromJsonAsync<StaffProfileDto>("/api/auth/me"))!.Role);
            Assert.Equal(HttpStatusCode.OK, (await signedInAfterRestart.GetAsync("/api/books")).StatusCode);
        }
        finally
        {
            var cleanupOptions = new DbContextOptionsBuilder<ApplicationDbContext>().UseSqlServer(connection).Options;
            await using var cleanup = new ApplicationDbContext(cleanupOptions);
            await cleanup.Database.EnsureDeletedAsync();
        }
    }

    private static async Task<HttpClient> LoginAsync(WebApplicationFactory<Program> server, string email, string password)
    {
        var client = server.CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/login", new { email, password });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var token = await response.Content.ReadFromJsonAsync<TokenResponse>();
        Assert.False(string.IsNullOrWhiteSpace(token?.AccessToken));
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token!.AccessToken);
        return client;
    }

    private sealed record TokenResponse(string AccessToken);
    private sealed record StaffProfileDto(string Id, string Email, string Role, bool IsDisabled);


}

public sealed class SqlServerApiFactory(string connection, TimeSpan? tokenLifetime = null) : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("ConnectionStrings:DefaultConnection", connection);
        if (tokenLifetime is { } lifetime)
            builder.ConfigureTestServices(services => services.PostConfigure<BearerTokenOptions>(IdentityConstants.BearerScheme,
                options => options.BearerTokenExpiration = lifetime));
    }
}
