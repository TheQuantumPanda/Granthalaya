using Library_Management_System.Services;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Library_Management_System.Services;

public sealed class ApiExceptionHandler(IProblemDetailsService problems, ILogger<ApiExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception, CancellationToken ct)
    {
        var (status, title) = exception switch
        {
            KeyNotFoundException => (404, exception.Message),
            ArgumentException => (400, exception.Message),
            DomainConflictException => (409, exception.Message),
            DbUpdateException db when PersistenceErrors.IsUniqueViolation(db) => (409, "A record with this unique value already exists."),
            DbUpdateException db when PersistenceErrors.IsForeignKeyViolation(db) => (409, "This record is referenced by another resource."),
            DbUpdateConcurrencyException => (409, "This record changed during the request."),
            _ => (500, "An unexpected server error occurred.")
        };
        if (status == 500) logger.LogError(exception, "Unhandled API failure");
        context.Response.StatusCode = status;
        return await problems.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = context,
            ProblemDetails = new ProblemDetails { Status = status, Title = title }
        });
    }
}

public sealed class DomainConflictException(string message, Exception? inner = null) : InvalidOperationException(message, inner);

public static class Pagination
{
    public static (int Page, int Size) Validate(int page, int size)
    {
        if (page < 1 || size < 1 || size > 100 || (long)(page - 1) * size > int.MaxValue)
            throw new ArgumentException("Page must be positive and pageSize must be between 1 and 100.");
        return (page, size);
    }
}
