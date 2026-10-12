# Security review — Granthalaya v2

This review covers current application code and the repository's existing history. It is a focused engineering review, not a guarantee against every attack.

## Authentication and authorization

- ASP.NET Core Identity issues opaque bearer tickets with a normal 30-minute lifetime; these are not JWTs.
- Staff policies require Admin or Librarian. Staff provisioning, directory management, and inquiry reading require Admin.
- Public endpoints are staff login, validated/rate-limited contact submission, and the public MVC home/privacy/static presentation. There is no public Identity registration endpoint.
- Initial Admin provisioning requires the explicit `--bootstrap-admin` CLI flag and secure configuration. Normal startup does not provision accounts.
- Every authenticated request validates the security stamp and account lockout state. Logout, password changes, role changes, and disable revoke old tickets. The last active Admin is protected from disable/demotion.
- SQL-backed and browser checks exercise role boundaries, refresh initialization, invalid/revoked sessions, account lifecycle, and password changes. A SQL-backed test uses an actual one-second ticket expiry configured only in its test factory; production/development settings remain at 30 minutes.

## Browser token handling

Only the access token is retained in `sessionStorage`; no refresh token is persisted. Session initialization asks the server to validate the token. Closing the tab ends that tab's retained session, and server revocation is checked on subsequent requests.

JavaScript-accessible storage is exposed to XSS and malicious browser extensions. React renders user fields as text; current frontend code has no `dangerouslySetInnerHTML` usage. Avoid untrusted scripts/extensions and do not paste tokens into issues or screenshots. API URL settings are restricted to loopback origins before any token-bearing request is sent. The frontend and SQL container bind to loopback for local use.

## Data and error handling

Services use EF Core parameterized LINQ queries; user input is not interpolated into SQL. Required/length/range/email validation, unique indexes, foreign keys, filtered active-loan uniqueness, date constraints, and optimistic return concurrency protect persisted records. APIs return Problem Details and domain explanations; unexpected failures return a generic 500 response rather than a stack trace. Sensitive EF parameter logging is not enabled.

SQL credentials stay in ignored `dev/sqlserver.env` and backend user secrets/environment configuration. Browser `VITE_*` settings must never contain secrets. SQL Server uses the local Developer edition; there is no cloud infrastructure or paid service dependency.

## Existing Git-history exposure — rotation still required

The initial commit **55a90a00** contains:

- A SQL Server credential in `Library-Management-System/appsettings.json`.
- A nonempty prefilled frontend login password in `LMS-Frontend/src/components/LoginModal.tsx`.

Values are deliberately omitted. Rotate the SQL login password wherever that historical credential was used, and rotate any real account that used the historical frontend password. Updating a local env file alone does not rotate an existing SQL login. Current files no longer containing those values does not erase history or invalidate copied credentials.

No Git history was rewritten. The owner must decide whether a coordinated history rewrite is needed after rotation; that action is outside this batch. Synthetic passwords in backend test fixtures are test-only values and must never be reused for real accounts. New E2E credentials are generated at runtime and never tracked.

## Ignored and shareable artifacts

`.gitignore` excludes local env files, user-secret/config overrides, keys/certificates, SQL database/backup files, build outputs, logs, test results, Playwright traces, browser state, and runtime E2E connection files. The E2E connection file has owner-only permissions and is deleted before the API starts. Test database names are generated and checked before setup/cleanup.

Failure traces can contain request headers or temporary account passwords. Keep `artifacts/` private. Curated `docs/screenshots/` images contain only neutral disposable demonstration records and were visually reviewed; they are the only intended shareable browser captures.

## Limitations

Local HTTP is used on loopback. No reverse proxy, hosted demo, TLS termination, or cloud deployment was added. Device compromise, hostile extensions, and other local processes remain outside the app's trust boundary. No project-wide external penetration test was performed. The repository owner still needs to choose a project license and rotate historically exposed credentials.
