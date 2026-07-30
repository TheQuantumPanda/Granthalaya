using Library_Management_System.DTOs;
using Library_Management_System.Models;

namespace Library_Management_System.Services;

public interface IBookService
{
    Task<BookListResponseDto> GetPaginatedBooksAsync(string? searchQuery, int page);
    Task<Book?> GetBookByIdAsync(int id);
    Task<Book> CreateBookAsync(Book book);
    Task<Book?> UpdateBookAsync(int id, Book book);
    Task<Book?> DeleteBookAsync(int id);
}
