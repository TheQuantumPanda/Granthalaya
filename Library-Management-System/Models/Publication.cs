using System.ComponentModel.DataAnnotations;

namespace Library_Management_System.Models;

public enum PublicationType
{
    Newspaper = 0,
    Magazine = 1
}

public class Publication
{
    [Key]
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Publisher { get; set; } = string.Empty;

    public DateTime PublishedDate { get; set; }

    public PublicationType Type { get; set; }

    public bool IsAvailable { get; set; } = true;
}
