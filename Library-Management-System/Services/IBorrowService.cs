using Library_Management_System.DTOs;
using Library_Management_System.Models;

namespace Library_Management_System.Services;

public interface IBorrowService
{
    Task<BorrowRecord> BorrowBookAsync(BorrowRequestDto request);
    Task<BorrowRecord> ReturnBookAsync(int borrowRecordId);
    Task<List<BorrowRecord>> GetAllBorrowRecordsAsync();
}
