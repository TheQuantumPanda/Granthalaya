using Library_Management_System.DTOs;

namespace Library_Management_System.Services;

public interface IBookService
{
    Task<BookListResponseDto> GetPaginatedBooksAsync(string? searchQuery, int page, int pageSize, bool availableOnly = false, string? genre = null);
    Task<BookDto?> GetBookByIdAsync(int id);
    Task<BookDto> CreateBookAsync(BookRequestDto request);
    Task<BookDto?> UpdateBookAsync(int id, BookRequestDto request);
    Task<bool> DeleteBookAsync(int id);
}
