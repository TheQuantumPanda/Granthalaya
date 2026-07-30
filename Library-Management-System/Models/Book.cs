using System.ComponentModel.DataAnnotations;

namespace Library_Management_System.Models;

public class Book
{
    [Key]
    public int BookId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Author { get; set; } = string.Empty;

    public string ISBN { get; set; } = string.Empty;

    public DateTime PublishedDate { get; set; }

    public bool IsAvailable { get; set; } = true;
}
