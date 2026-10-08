using Microsoft.AspNetCore.RateLimiting;
using Library_Management_System.DTOs;
using Library_Management_System.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Library_Management_System.Controllers;

[ApiController, Route("api/auth")]
public sealed class AuthController(SignInManager<IdentityUser> signIn, UserManager<IdentityUser> users) : ControllerBase
{
    [AllowAnonymous, EnableRateLimiting("login"), HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto request)
    {
        signIn.AuthenticationScheme = IdentityConstants.BearerScheme;
        var user = await users.FindByEmailAsync(request.Email);
        if (user is null) return Problem(statusCode: StatusCodes.Status401Unauthorized, title: "Invalid credentials or account unavailable.");
        var result = await signIn.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: true);
        if (!result.Succeeded || !(await users.IsInRoleAsync(user, StaffSecurity.AdminRole) ||
            await users.IsInRoleAsync(user, StaffSecurity.LibrarianRole)))
            return Problem(statusCode: StatusCodes.Status401Unauthorized, title: "Invalid credentials or account unavailable.");
        await signIn.SignInAsync(user, isPersistent: false);
        // Identity's bearer handler writes its opaque access-token response during SignInAsync.
        return new EmptyResult();
    }

    [Authorize(Policy = StaffSecurity.Staff), HttpGet("me")]
    public async Task<ActionResult<StaffProfileDto>> Me()
    {
        var user = await users.GetUserAsync(User);
        if (user is null) return Unauthorized();
        return new StaffProfileDto(user.Id, user.Email ?? "", User.IsInRole(StaffSecurity.AdminRole) ? StaffSecurity.AdminRole : StaffSecurity.LibrarianRole, false);
    }

    [Authorize(Policy = StaffSecurity.Staff), HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto request)
    {
        var user = await users.GetUserAsync(User);
        if (user is null) return Unauthorized();
        var result = await users.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
            return ValidationProblem(new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                ["password"] = result.Errors.Select(e => e.Description).ToArray()
            }));
        // Identity rotates the security stamp when a password changes.
        return NoContent();
    }

    [Authorize(Policy = StaffSecurity.Staff), HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var user = await users.GetUserAsync(User);
        if (user is null) return Unauthorized();
        var result = await users.UpdateSecurityStampAsync(user);
        return result.Succeeded ? NoContent() : Problem(statusCode: 500, title: "Could not end session.");
    }
}
