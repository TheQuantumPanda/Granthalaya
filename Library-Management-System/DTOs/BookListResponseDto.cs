namespace Library_Management_System.DTOs;

public class BookListResponseDto
{
    public List<Library_Management_System.Models.Book> Books { get; set; } = new();
    public int CurrentPage { get; set; }
    public int TotalPages { get; set; }
    public int TotalItems { get; set; }
    public string SearchQuery { get; set; } = string.Empty;
}
