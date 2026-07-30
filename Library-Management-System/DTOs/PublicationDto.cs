using System.ComponentModel.DataAnnotations;
using Library_Management_System.Models;

namespace Library_Management_System.DTOs;

public class CreatePublicationDto
{
    [Required]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Publisher { get; set; } = string.Empty;

    [Required]
    public DateTime PublishedDate { get; set; }

    [Required]
    public PublicationType Type { get; set; }

    public bool IsAvailable { get; set; } = true;
}
