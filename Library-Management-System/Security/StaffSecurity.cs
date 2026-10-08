using System.Security.Claims;
using Library_Management_System.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Library_Management_System.Security;

public static class StaffSecurity
{
    public const string Staff = "Staff";
    public const string Admin = "Admin";
    public const string AdminRole = "Admin";
    public const string LibrarianRole = "Librarian";

    // Identity's opaque bearer ticket contains a security stamp. Compare it on every request so
    // logout, lockout and role changes invalidate outstanding access tokens immediately.
    public static async Task ValidateBearerSession(HttpContext context, RequestDelegate next)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var users = context.RequestServices.GetRequiredService<UserManager<IdentityUser>>();
            var id = users.GetUserId(context.User);
            var user = id is null ? null : await users.FindByIdAsync(id);
            var ticketStamp = context.User.FindFirstValue(users.Options.ClaimsIdentity.SecurityStampClaimType);
            if (user is null || ticketStamp is null || ticketStamp != await users.GetSecurityStampAsync(user)
                || await users.IsLockedOutAsync(user))
            {
                context.User = new ClaimsPrincipal(new ClaimsIdentity());
            }
        }
        await next(context);
    }

    public static async Task BootstrapAdminAsync(IServiceProvider services, IConfiguration config)
    {
        if (!config.GetValue<bool>("BootstrapAdmin:Enabled")) return;
        using var scope = services.CreateScope();
        var users = scope.ServiceProvider.GetRequiredService<UserManager<IdentityUser>>();
        var roles = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var email = config["BootstrapAdmin:Email"];
        var password = config["BootstrapAdmin:Password"];
        if (!await db.Database.CanConnectAsync())
            throw new InvalidOperationException("Apply EF migrations before bootstrapping the administrator.");
        foreach (var name in new[] { AdminRole, LibrarianRole })
            if (!await roles.RoleExistsAsync(name))
            {
                var created = await roles.CreateAsync(new IdentityRole(name));
                if (!created.Succeeded) throw new InvalidOperationException("Could not initialize staff roles.");
            }
        var adminRole = await roles.FindByNameAsync(AdminRole) ?? throw new InvalidOperationException("Admin role is missing.");
        var admins = await (from user in db.Users join ur in db.UserRoles on user.Id equals ur.UserId
            where ur.RoleId == adminRole.Id select user).ToListAsync();
        if (admins.Any(u => u.LockoutEnd is null || u.LockoutEnd <= DateTimeOffset.UtcNow)) return;
        if (admins.Count > 0) throw new InvalidOperationException("An administrator exists but is disabled; resolve it manually.");
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
            throw new InvalidOperationException("BootstrapAdmin requires Email and Password from secure configuration.");
        if (await users.FindByEmailAsync(email) is not null)
            throw new InvalidOperationException("Bootstrap email already belongs to an account; resolve it manually.");
        var admin = new IdentityUser { UserName = email, Email = email, EmailConfirmed = true, LockoutEnabled = true };
        var result = await users.CreateAsync(admin, password);
        if (!result.Succeeded) throw new InvalidOperationException("Bootstrap administrator failed Identity validation.");
        result = await users.AddToRoleAsync(admin, AdminRole);
        if (!result.Succeeded) throw new InvalidOperationException("Bootstrap administrator role assignment failed.");
    }
}
