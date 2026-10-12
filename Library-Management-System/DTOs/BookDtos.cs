using System.ComponentModel.DataAnnotations;
using Library_Management_System.Models;

namespace Library_Management_System.DTOs;

public class BookRequestDto
{
    [Required, StringLength(250)] public string Title { get; set; } = string.Empty;
    [Required, StringLength(200)] public string Author { get; set; } = string.Empty;
    [Required, StringLength(20)] public string ISBN { get; set; } = string.Empty;
    [StringLength(100)] public string Genre { get; set; } = string.Empty;
    [StringLength(200)] public string Publisher { get; set; } = string.Empty;
    [Range(1450, 2200)] public int PublicationYear { get; set; }
    [StringLength(2000)] public string Description { get; set; } = string.Empty;
}

public class BookCopyRequestDto
{
    [Required, StringLength(64)] public string AccessionNumber { get; set; } = string.Empty;
    [StringLength(100)] public string Condition { get; set; } = string.Empty;
    [EnumDataType(typeof(CopyStatus))] public CopyStatus Status { get; set; } = CopyStatus.Circulating;
}

public class BookCopyDto
{
    public int BookCopyId { get; set; }
    public int BookId { get; set; }
    public string AccessionNumber { get; set; } = string.Empty;
    public string Condition { get; set; } = string.Empty;
    public CopyStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsAvailable { get; set; }
}

public class BookDto
{
    public int BookId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public string ISBN { get; set; } = string.Empty;
    public string Genre { get; set; } = string.Empty;
    public string Publisher { get; set; } = string.Empty;
    public int PublicationYear { get; set; }
    public string Description { get; set; } = string.Empty;
    public int CopyCount { get; set; }
    public int AvailableCopyCount { get; set; }
    public bool IsAvailable => AvailableCopyCount > 0;
    public List<BookCopyDto> BookCopies { get; set; } = new();
}

public class BookListResponseDto
{
    public List<BookDto> Books { get; set; } = new();
    public int CurrentPage { get; set; }
    public int TotalPages { get; set; }
    public int TotalItems { get; set; }
    public string SearchQuery { get; set; } = string.Empty;
}
