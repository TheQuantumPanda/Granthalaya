using System.ComponentModel.DataAnnotations;

namespace Library_Management_System.DTOs;

public sealed class LoginDto
{
    [Required, EmailAddress, StringLength(254)] public string Email { get; set; } = string.Empty;
    [Required, StringLength(128)] public string Password { get; set; } = string.Empty;
}
public sealed record StaffProfileDto(string Id, string Email, string Role, bool IsDisabled);
public sealed class CreateStaffDto
{
    [Required, EmailAddress, StringLength(254)] public string Email { get; set; } = string.Empty;
    [Required, StringLength(128, MinimumLength = 12)] public string Password { get; set; } = string.Empty;
}
public sealed class ChangeStaffRoleDto
{
    [Required, RegularExpression("^(Admin|Librarian)$")] public string Role { get; set; } = string.Empty;
}

public sealed class ChangePasswordDto
{
    [Required, StringLength(128)] public string CurrentPassword { get; set; } = string.Empty;
    [Required, StringLength(128, MinimumLength = 12)] public string NewPassword { get; set; } = string.Empty;
}
