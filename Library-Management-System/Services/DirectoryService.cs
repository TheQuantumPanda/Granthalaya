using Library_Management_System.Data;
using Library_Management_System.DTOs;
using Library_Management_System.Models;
using Microsoft.EntityFrameworkCore;

namespace Library_Management_System.Services;

public interface IDirectoryService
{
    Task<LibrarianPageDto> LibrariansAsync(string? search, int page, CancellationToken ct);
    Task<LibrarianDto?> LibrarianAsync(int id, CancellationToken ct);
    Task<LibrarianDto> CreateLibrarianAsync(LibrarianRequestDto request, CancellationToken ct);
    Task<LibrarianDto?> UpdateLibrarianAsync(int id, LibrarianRequestDto request, CancellationToken ct);
    Task<bool> DeleteLibrarianAsync(int id, CancellationToken ct);
    Task<PublicationPageDto> PublicationsAsync(string? type, string? search, int page, CancellationToken ct);
    Task<PublicationDto?> PublicationAsync(int id, CancellationToken ct);
    Task<PublicationDto> CreatePublicationAsync(CreatePublicationDto request, CancellationToken ct);
    Task<PublicationDto?> UpdatePublicationAsync(int id, CreatePublicationDto request, CancellationToken ct);
    Task<bool> DeletePublicationAsync(int id, CancellationToken ct);
    Task SubmitContactAsync(ContactRequestDto request, CancellationToken ct);
    Task<IReadOnlyList<ContactMessageDto>> ContactMessagesAsync(CancellationToken ct);
}
public sealed class DirectoryService(ApplicationDbContext db) : IDirectoryService
{
    private static LibrarianDto Map(Librarian x) => new(x.LibrarianId, x.Name, x.Age, x.Phone);
    private static PublicationDto Map(Publication x) => new(x.Id, x.Title, x.Publisher, x.PublishedDate, x.Type, x.IsAvailable);
    private static void Apply(Librarian x, LibrarianRequestDto r) { x.Name = r.Name.Trim(); x.Age = r.Age; x.Phone = r.Phone.Trim(); }
    private static void Apply(Publication x, CreatePublicationDto r) { x.Title = r.Title.Trim(); x.Publisher = r.Publisher.Trim(); x.PublishedDate = r.PublishedDate; x.Type = r.Type; x.IsAvailable = r.IsAvailable; }
    public async Task<LibrarianPageDto> LibrariansAsync(string? search, int page, CancellationToken ct)
    {
        (page, _) = Pagination.Validate(page, 5);
        var q = db.Librarians.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(search)) { var term = search.Trim(); q = q.Where(x => x.Name.Contains(term)); }
        var total = await q.CountAsync(ct);
        var items = await q.OrderBy(x => x.LibrarianId).Skip((page - 1) * 5).Take(5).ToListAsync(ct);
        return new(items.Select(Map).ToList(), page, (int)Math.Ceiling(total / 5.0), total);
    }
    public async Task<LibrarianDto?> LibrarianAsync(int id, CancellationToken ct) => await db.Librarians.AsNoTracking().FirstOrDefaultAsync(x => x.LibrarianId == id, ct) is { } x ? Map(x) : null;
    public async Task<LibrarianDto> CreateLibrarianAsync(LibrarianRequestDto request, CancellationToken ct) { var x = new Librarian(); Apply(x, request); db.Librarians.Add(x); await db.SaveChangesAsync(ct); return Map(x); }
    public async Task<LibrarianDto?> UpdateLibrarianAsync(int id, LibrarianRequestDto request, CancellationToken ct) { var x = await db.Librarians.FindAsync([id], ct); if (x is null) return null; Apply(x, request); await db.SaveChangesAsync(ct); return Map(x); }
    public async Task<bool> DeleteLibrarianAsync(int id, CancellationToken ct) { var x = await db.Librarians.FindAsync([id], ct); if (x is null) return false; db.Librarians.Remove(x); await db.SaveChangesAsync(ct); return true; }
    public async Task<PublicationPageDto> PublicationsAsync(string? type, string? search, int page, CancellationToken ct)
    {
        (page, _) = Pagination.Validate(page, 5);
        var q = db.Publications.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(type))
        {
            if (!Enum.TryParse<PublicationType>(type, true, out var kind) || !Enum.IsDefined(kind)) throw new ArgumentException("Invalid publication type.");
            q = q.Where(x => x.Type == kind);
        }
        if (!string.IsNullOrWhiteSpace(search)) { var term = search.Trim(); q = q.Where(x => x.Title.Contains(term) || x.Publisher.Contains(term)); }
        var total = await q.CountAsync(ct);
        var items = await q.OrderBy(x => x.Id).Skip((page - 1) * 5).Take(5).ToListAsync(ct);
        return new(items.Select(Map).ToList(), page, (int)Math.Ceiling(total / 5.0), total);
    }
    public async Task<PublicationDto?> PublicationAsync(int id, CancellationToken ct) => await db.Publications.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct) is { } x ? Map(x) : null;
    public async Task<PublicationDto> CreatePublicationAsync(CreatePublicationDto request, CancellationToken ct) { var x = new Publication(); Apply(x, request); db.Publications.Add(x); await db.SaveChangesAsync(ct); return Map(x); }
    public async Task<PublicationDto?> UpdatePublicationAsync(int id, CreatePublicationDto request, CancellationToken ct) { var x = await db.Publications.FindAsync([id], ct); if (x is null) return null; Apply(x, request); await db.SaveChangesAsync(ct); return Map(x); }
    public async Task<bool> DeletePublicationAsync(int id, CancellationToken ct) { var x = await db.Publications.FindAsync([id], ct); if (x is null) return false; db.Publications.Remove(x); await db.SaveChangesAsync(ct); return true; }
    public async Task SubmitContactAsync(ContactRequestDto request, CancellationToken ct)
    {
        db.ContactMessages.Add(new ContactMessage { Name = request.Name.Trim(), Email = request.Email.Trim(), Subject = request.Subject.Trim(), Message = request.Message.Trim(), SubmittedAt = DateTime.UtcNow });
        await db.SaveChangesAsync(ct);
    }
    public async Task<IReadOnlyList<ContactMessageDto>> ContactMessagesAsync(CancellationToken ct) =>
        await db.ContactMessages.AsNoTracking().OrderByDescending(x => x.SubmittedAt)
            .Select(x => new ContactMessageDto(x.Id, x.Name, x.Email, x.Subject, x.Message, x.SubmittedAt)).ToListAsync(ct);
}
