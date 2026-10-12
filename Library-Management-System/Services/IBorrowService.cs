using Library_Management_System.DTOs;

namespace Library_Management_System.Services;

public interface IBorrowService
{
    Task<BorrowRecordDto> BorrowBookAsync(BorrowRequestDto request);
    Task<BorrowRecordDto> ReturnBookAsync(int borrowRecordId);
    Task<BorrowRecordPageDto> GetRecordsAsync(string? search, string? status, int page, int pageSize);
}
