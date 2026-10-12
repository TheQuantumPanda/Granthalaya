# Batch 5 verification — 12 October 2026

Verification ran on `refactor/granthalaya-v2` on the existing Linux host. No commits, pushes, merges, or history rewrites were performed. The persistent development database and administrator records were preserved.

## Final gates

| Gate | Observed result |
|---|---|
| `dotnet restore Library-Management-System.Tests` | Passed |
| `dotnet build Library-Management-System` | Passed; zero warnings/errors |
| `dotnet test Library-Management-System.Tests` | **39 passed, 0 failed, 0 skipped** |
| SQL Server cases within that run | **7 executed and passed**, using disposable databases |
| `dotnet ef migrations has-pending-model-changes --project Library-Management-System` | No pending model changes |
| `npm --prefix LMS-Frontend ci` | Passed |
| `npm --prefix LMS-Frontend run lint` | Passed |
| `npm --prefix LMS-Frontend run build` | Passed |
| `npm --prefix LMS-Frontend audit --omit=dev` | Zero vulnerabilities |
| Full npm audit and transitive NuGet vulnerability check | No reported vulnerabilities |
| `npm --prefix LMS-Frontend run test:e2e -- --screenshots` | **5 passed**, 39 seconds; generated database removed |
| `git diff --check` | Passed |

The original 36 backend tests remain. Three new cases cover SQL pagination/filtering with tied sort dates, natural Identity ticket expiry, and normal Development startup without automatic Admin provisioning. Existing API coverage also checks invalid pagination Problem Details.

## Actual browser journeys

| Journey | Executed checks | Result |
|---|---|---|
| Admin catalog and directory | Login; book/copy creation; inventory; genre filtering; publication create/edit/date/delete; librarian directory CRUD; logout | Passed |
| Circulation | Student registration; available-copy selection; borrowing; return; refreshed inventory; preserved history; page navigation and filters | Passed |
| Librarian authorization | Permitted access; hidden Admin controls; direct staff/directory/inbox HTTP 403; invalid token HTTP 401; refresh initialization; logout revocation | Passed |
| Validation and inbox | Invalid year/email; duplicate ISBN/registration feedback; conflicting loan HTTP 409; contact submission; inbox search and pagination | Passed |
| Staff lifecycle | Account creation; Admin/Librarian role changes; disable/re-enable; old-token revocation; password-change revocation; Settings validation | Passed |

These were Chromium interactions with the built React frontend, actual ASP.NET Core API, and SQL Server, not mock routes. Shared dialog behavior was exercised through login, catalog/details/confirmation, students, borrowing, publications, directory, and Settings: initial focus, Tab/Shift+Tab containment, Escape, and restoration. Nested catalog dialogs were checked explicitly. No cross-browser or screen-reader certification is claimed.

Natural expiry was verified separately through a SQL-backed API test using a one-second Identity ticket and real elapsed time. Normal configuration remains 30 minutes. Invalid/revoked sessions, refresh initialization, logout, role changes, password changes, and account disable were exercised through tests and browser journeys.

## Implementation and failures resolved

- Loans and the Admin inquiry inbox now use bounded server pagination, stable date/ID sorting, counts, search, and suitable indexes. Loan status filtering uses persisted dates and UTC.
- Shared dialog focus handling replaces duplicated implementations. A real nested-dialog focus-restoration failure was resolved by restoring after the closing React commit.
- The Settings API label was linked to its input after the account journey exposed the missing association.
- E2E now serves the production build; development hot reload had interrupted an earlier test run during source changes.
- Bootstrap runs only through the explicit CLI. The E2E runner invokes that real CLI with ephemeral credentials.
- Loopback-only API settings prevent sending stored bearer tokens to arbitrary configured origins. Account controls prevent duplicate operations while busy.
- Removed unused AI/server dependencies and obsolete AI metadata. An attempted dependency-category rearrangement hit npm policy error `EALLOWREMOTE` for an optional package; it was abandoned. Final locked install, lint, build, and audits pass without changing the local approval policy.
- SQL container stop initially required a forced kill because the upstream launcher did not forward signals. The Compose entrypoint now executes SQL Server directly after the permission check; a subsequent stop/start completed gracefully. The tested image is pinned.

## Setup and database safety

Verified on the current host: local tool restoration, private credential-file generation/refusal to overwrite, dependency installation, SQL health, migrations on disposable SQL databases, explicit administrator CLI provisioning, API/frontend startup, backend SQL tests, E2E startup/cleanup, and persistent SQL stop/restart. Fish environment syntax was exercised with the SQL test run; Bash setup commands were also used.

The six main development record/migration counts were unchanged across the container restart check. No library records, accounts, volumes, or development database were reset. The new migration creates only two sorting indexes and was applied to disposable databases. Apply it to development through the documented `dotnet ef database update` command before normal use of this checkout.

Generated E2E database names and ownership markers gate cleanup. Invalid database names and absent test configuration were rejected. Credentials are generated at runtime; private connection files are deleted before API startup. Failure traces/logs remain ignored and should not be published.

Fresh distribution package installation, an interrupted-run cleanup test, browser engines other than Chromium, and a fresh-machine installation were not executed. Instructions distinguish those prerequisites from observed results. No host-level browser packages were installed.

## Screenshots actually captured

All six images in [screenshots/](screenshots/) are **1440 × 1000** real application captures from the disposable SQL dataset, visually reviewed for loaded content and neutral records:

- `dashboard.png`
- `books-and-copies.png`
- `students.png`
- `borrowing.png`
- `reports.png`
- `staff-accounts.png`

No video was recorded. [DEMO.md](../DEMO.md) is a recording script and three resume bullet options.

## Security and release decisions

Current-source, tracked/untracked-file, ignore-rule, authorization, validation, query, error, and dependency review is recorded in [SECURITY.md](SECURITY.md). The existing five-commit history was reviewed; the initial commit contains a SQL credential and prefilled login password. Values are withheld. Rotate them wherever used; history remains unchanged. JavaScript-accessible sessionStorage has XSS/extension exposure even with revocation checks.

No project-level license exists. The owner must choose one before making licensing claims. Granthalaya remains local-only, with SQL Server required and no hosted demo. There are no added reservations, renewals, fines, payments, or email-delivery features.

The implementation is ready for final code review and merge consideration: all available gates pass. Before public portfolio release, resolve historical credential rotation and the license decision. Apply the additive migration through normal local setup. See [LOCAL_SETUP.md](LOCAL_SETUP.md) for reproducible commands.

## File inventory

The complete Batch 5 changed-file list is in [BATCH5_FILES.md](BATCH5_FILES.md). Old screenshots were replaced by the six current captures; the old IEEE document was archived with a superseded-content warning. No functioning feature was removed.
