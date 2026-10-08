using Library_Management_System.Data;
using Library_Management_System.DTOs;
using Library_Management_System.Security;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Library_Management_System.Services;

public interface IStaffAccountsService
{
    Task<IReadOnlyList<StaffProfileDto>> ListAsync(CancellationToken ct);
    Task<StaffProfileDto?> GetAsync(string id, CancellationToken ct);
    Task<StaffProfileDto> CreateLibrarianAsync(CreateStaffDto request);
    Task<StaffProfileDto?> ChangeRoleAsync(string id, string role, CancellationToken ct);
    Task<bool> DisableAsync(string id, CancellationToken ct);
    Task<bool> EnableAsync(string id, CancellationToken ct);
}

public sealed class StaffAccountsService(UserManager<IdentityUser> users, RoleManager<IdentityRole> roles,
    ApplicationDbContext db) : IStaffAccountsService
{
    public async Task<IReadOnlyList<StaffProfileDto>> ListAsync(CancellationToken ct)
    {
        var roleNames = await db.Roles.AsNoTracking().Where(r => r.Name == StaffSecurity.AdminRole || r.Name == StaffSecurity.LibrarianRole)
            .ToDictionaryAsync(r => r.Id, r => r.Name!, ct);
        var records = await (from u in db.Users.AsNoTracking()
            join ur in db.UserRoles.AsNoTracking() on u.Id equals ur.UserId
            orderby u.Email
            select new { u.Id, u.Email, u.LockoutEnd, ur.RoleId }).ToListAsync(ct);
        return records.Where(x => roleNames.ContainsKey(x.RoleId))
            .Select(x => new StaffProfileDto(x.Id, x.Email ?? "", roleNames[x.RoleId], x.LockoutEnd == DateTimeOffset.MaxValue)).ToList();
    }

    public async Task<StaffProfileDto?> GetAsync(string id, CancellationToken ct) =>
        (await ListAsync(ct)).FirstOrDefault(x => x.Id == id);

    public async Task<StaffProfileDto> CreateLibrarianAsync(CreateStaffDto request)
    {
        if (!await roles.RoleExistsAsync(StaffSecurity.LibrarianRole))
            throw new InvalidOperationException("Staff roles are not initialized. Run administrator bootstrap.");
        if (await users.FindByEmailAsync(request.Email.Trim()) is not null)
            throw new DomainConflictException("Staff email already exists.");
        var user = new IdentityUser { UserName = request.Email.Trim(), Email = request.Email.Trim(), EmailConfirmed = true, LockoutEnabled = true };
        var result = await users.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            if (result.Errors.Any(e => e.Code.StartsWith("Duplicate", StringComparison.Ordinal)))
                throw new DomainConflictException("Staff email already exists.");
            throw new ArgumentException(string.Join(" ", result.Errors.Select(e => e.Description)));
        }
        result = await users.AddToRoleAsync(user, StaffSecurity.LibrarianRole);
        if (!result.Succeeded) throw new InvalidOperationException("Could not assign librarian role.");
        return new StaffProfileDto(user.Id, user.Email!, StaffSecurity.LibrarianRole, false);
    }

    public async Task<StaffProfileDto?> ChangeRoleAsync(string id, string role, CancellationToken ct)
    {
        if (role != StaffSecurity.AdminRole && role != StaffSecurity.LibrarianRole)
            throw new ArgumentException("Invalid staff role.");
        await using var transaction = db.Database.IsRelational()
            ? await db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable, ct) : null;
        var user = await users.FindByIdAsync(id);
        if (user is null) return null;
        var currentAdmin = await users.IsInRoleAsync(user, StaffSecurity.AdminRole);
        if (currentAdmin && role != StaffSecurity.AdminRole) await RequireAnotherActiveAdminAsync(id, ct);
        var oldRoles = await users.GetRolesAsync(user);
        var remove = await users.RemoveFromRolesAsync(user, oldRoles);
        if (!remove.Succeeded) throw new InvalidOperationException("Could not change staff role.");
        var add = await users.AddToRoleAsync(user, role);
        if (!add.Succeeded) throw new InvalidOperationException("Could not change staff role.");
        await users.UpdateSecurityStampAsync(user);
        if (transaction is not null) await transaction.CommitAsync(ct);
        return new StaffProfileDto(user.Id, user.Email ?? "", role, user.LockoutEnd == DateTimeOffset.MaxValue);
    }

    public async Task<bool> DisableAsync(string id, CancellationToken ct)
    {
        await using var transaction = db.Database.IsRelational()
            ? await db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable, ct) : null;
        var user = await users.FindByIdAsync(id);
        if (user is null) return false;
        if (await users.IsInRoleAsync(user, StaffSecurity.AdminRole)) await RequireAnotherActiveAdminAsync(id, ct);
        var result = await users.SetLockoutEndDateAsync(user, DateTimeOffset.MaxValue);
        if (!result.Succeeded) throw new InvalidOperationException("Could not disable staff account.");
        await users.UpdateSecurityStampAsync(user);
        if (transaction is not null) await transaction.CommitAsync(ct);
        return true;
    }

    public async Task<bool> EnableAsync(string id, CancellationToken ct)
    {
        var user = await users.FindByIdAsync(id);
        if (user is null) return false;
        var result = await users.SetLockoutEndDateAsync(user, null);
        if (!result.Succeeded) throw new InvalidOperationException("Could not enable staff account.");
        await users.ResetAccessFailedCountAsync(user);
        await users.UpdateSecurityStampAsync(user);
        return true;
    }

    private async Task RequireAnotherActiveAdminAsync(string excludingId, CancellationToken ct)
    {
        var admin = await roles.FindByNameAsync(StaffSecurity.AdminRole)
            ?? throw new InvalidOperationException("Admin role is missing.");
        var other = await (from u in db.Users
            join ur in db.UserRoles on u.Id equals ur.UserId
            where ur.RoleId == admin.Id && u.Id != excludingId && (u.LockoutEnd == null || u.LockoutEnd <= DateTimeOffset.UtcNow)
            select u.Id).AnyAsync(ct);
        if (!other) throw new DomainConflictException("The last active administrator cannot be removed or disabled.");
    }
}
