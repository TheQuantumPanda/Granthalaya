using System.ComponentModel.DataAnnotations;
using Library_Management_System.Models;

namespace Library_Management_System.DTOs;

public class CreatePublicationDto : IValidatableObject
{
    [Required, StringLength(250)]
    public string Title { get; set; } = string.Empty;

    [Required, StringLength(200)]
    public string Publisher { get; set; } = string.Empty;

    [Required]
    public DateTime PublishedDate { get; set; }

    [EnumDataType(typeof(PublicationType))]
    public PublicationType Type { get; set; }

    public bool IsAvailable { get; set; } = true;

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (PublishedDate == default)
            yield return new ValidationResult("Published date is required.", [nameof(PublishedDate)]);
    }
}
