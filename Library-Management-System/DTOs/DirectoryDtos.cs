using System.ComponentModel.DataAnnotations;
using Library_Management_System.Models;

namespace Library_Management_System.DTOs;

public sealed class LibrarianRequestDto
{
    [Required, StringLength(200)] public string Name { get; set; } = string.Empty;
    [Range(18, 100)] public int Age { get; set; }
    [Required, StringLength(30)] public string Phone { get; set; } = string.Empty;
}
public sealed record LibrarianDto(int LibrarianId, string Name, int Age, string Phone);
public sealed record LibrarianPageDto(IReadOnlyList<LibrarianDto> Librarians, int CurrentPage, int TotalPages, int TotalItems);
public sealed record PublicationDto(int Id, string Title, string Publisher, DateTime PublishedDate, PublicationType Type, bool IsAvailable);
public sealed record PublicationPageDto(IReadOnlyList<PublicationDto> Publications, int CurrentPage, int TotalPages, int TotalItems);
public sealed class ContactRequestDto
{
    [Required, StringLength(200)] public string Name { get; set; } = string.Empty;
    [Required, EmailAddress, StringLength(254)] public string Email { get; set; } = string.Empty;
    [Required, StringLength(200)] public string Subject { get; set; } = string.Empty;
    [Required, StringLength(4000)] public string Message { get; set; } = string.Empty;
}
public sealed record ContactMessageDto(int Id, string Name, string Email, string Subject, string Message, DateTime SubmittedAt);
public sealed record ContactMessagePageDto(IReadOnlyList<ContactMessageDto> Messages, int CurrentPage, int TotalPages, int TotalItems);
