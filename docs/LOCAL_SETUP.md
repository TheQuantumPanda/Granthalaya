# Local Linux setup

Use this guide from the repository root. The application is permanently local-only. The commands below use SQL Server 2022 Developer in a persistent Podman volume.

## 1. Install prerequisites and clone

Install Git, the **.NET 10 SDK**, **Node.js 22+ with npm**, and **Podman with a Compose provider** through your Linux distribution or official packages. Check the [official .NET Linux instructions](https://learn.microsoft.com/en-us/dotnet/core/install/linux), [Node.js downloads](https://nodejs.org/en/download), and [Podman installation](https://podman.io/docs/installation). Rootless Podman requires subordinate UID/GID mappings; `podman compose` delegates to an external provider such as `podman-compose` ([Podman documentation](https://docs.podman.io/en/latest/markdown/podman-compose.1.html)).

```bash
git clone https://github.com/TheQuantumPanda/Granthalaya.git
cd Granthalaya
git switch refactor/granthalaya-v2
dotnet --info
node --version
npm --version
podman --version
podman compose version
dotnet tool restore
dotnet restore Library-Management-System.Tests
npm --prefix LMS-Frontend ci
```

These commands also work in Fish. Package installation depends on your distribution and was not performed during final verification. The current machine already had the required runtime and Compose provider.

## 2. Create private database credentials and start SQL Server

```bash
node dev/create-sql-env.mjs
podman compose --env-file dev/sqlserver.env -f dev/compose.yaml up -d
podman ps --filter name=granthalaya-sqlserver-dev
```

The small script creates `dev/sqlserver.env` with a random password and mode `0600`. It refuses to overwrite existing credentials. Do not regenerate an existing SQL Server password file as a reset mechanism: changing the file does not change an existing SQL login password.

The Compose entrypoint runs the image permission check and then uses `exec` for SQL Server, so it receives container stop signals directly. This addresses the observed upstream launcher signal-forwarding issue ([Microsoft repository issue #968](https://github.com/microsoft/mssql-docker/issues/968)). No volume or database reset is involved.

Wait for the container to report **healthy**. Compose pins the tested SQL Server 2022 image digest (build 16.0.4295.3); update it deliberately and rerun verification when upgrading. The SQL port is `127.0.0.1:14333`; the named volume `granthalaya-sqlserver-data` persists across container restarts. The container needs the documented 3 GB memory allocation. Review container logs locally if startup fails; keep logs private.

## 3. Configure backend user secrets and apply migrations

Bash:

```bash
set -a
. dev/sqlserver.env
set +a
dotnet user-secrets set --project Library-Management-System "ConnectionStrings:DefaultConnection" "Server=127.0.0.1,14333;Database=Granthalaya;User Id=sa;Password=$MSSQL_SA_PASSWORD;Encrypt=True;TrustServerCertificate=True"
unset MSSQL_SA_PASSWORD
dotnet ef database update --project Library-Management-System
```

Fish:

```fish
set -gx MSSQL_SA_PASSWORD (string replace -r '^MSSQL_SA_PASSWORD=' '' (cat dev/sqlserver.env))
dotnet user-secrets set --project Library-Management-System "ConnectionStrings:DefaultConnection" "Server=127.0.0.1,14333;Database=Granthalaya;User Id=sa;Password=$MSSQL_SA_PASSWORD;Encrypt=True;TrustServerCertificate=True"
set -e MSSQL_SA_PASSWORD
dotnet ef database update --project Library-Management-System
```

The secret is stored outside tracked source. Do not print it, paste it into tickets, or put it in `appsettings.json`. Migrations add/update the schema; they do not reset user records. Batch 5 adds only history/inquiry sorting indexes. The existing development database was not migrated/reset during Batch 5 verification; the migration was applied to disposable databases. Apply it locally with the command above when ready.

## 4. Bootstrap the first administrator explicitly

Choose a password of at least 12 characters with uppercase, lowercase, a digit, and a symbol. The command creates roles and the first Admin only if no active Admin exists. Normal API startup never provisions an administrator.

Bash:

```bash
read -r -p 'Admin email: ' GRANTHALAYA_ADMIN_EMAIL
read -r -s -p 'Admin password: ' GRANTHALAYA_ADMIN_PASSWORD
printf '\n'
BootstrapAdmin__Enabled=true BootstrapAdmin__Email="$GRANTHALAYA_ADMIN_EMAIL" BootstrapAdmin__Password="$GRANTHALAYA_ADMIN_PASSWORD" dotnet run --project Library-Management-System -- --bootstrap-admin
unset GRANTHALAYA_ADMIN_EMAIL GRANTHALAYA_ADMIN_PASSWORD
```

Fish:

```fish
read --prompt-str 'Admin email: ' GRANTHALAYA_ADMIN_EMAIL
read --silent --prompt-str 'Admin password: ' GRANTHALAYA_ADMIN_PASSWORD
env BootstrapAdmin__Enabled=true BootstrapAdmin__Email="$GRANTHALAYA_ADMIN_EMAIL" BootstrapAdmin__Password="$GRANTHALAYA_ADMIN_PASSWORD" dotnet run --project Library-Management-System -- --bootstrap-admin
set -e GRANTHALAYA_ADMIN_EMAIL
set -e GRANTHALAYA_ADMIN_PASSWORD
```

There is no default application password. Admins provision additional Librarian sign-in accounts through the application.

## 5. Start API and frontend

Use separate terminals; commands are identical in Bash and Fish:

```bash
dotnet run --project Library-Management-System
```

```bash
npm --prefix LMS-Frontend run dev
```

Open `http://127.0.0.1:3000`. The API listens on `http://localhost:5199`. If a different loopback API port is required, set `VITE_API_BASE_URL` in ignored `LMS-Frontend/.env.local` before starting Vite, or use Settings. Changing API origin ends the current session. No frontend secrets belong in `VITE_*` variables because they are public browser configuration.

Sample records are optional: `SeedData__Enabled=true` in Development inserts demonstration rows after migrations; it does not duplicate existing rows. Skip sample seeding when using real library records. The Playwright runner supplies its own isolated demonstration data.

## 6. Backend SQL Server tests

Set a test-server connection with permission to create/drop databases. No database catalog is required: tests replace it with generated names.

Bash:

```bash
set -a
. dev/sqlserver.env
set +a
export GRANTHALAYA_TEST_SQL_CONNECTION="Server=127.0.0.1,14333;User Id=sa;Password=$MSSQL_SA_PASSWORD;Encrypt=True;TrustServerCertificate=True"
unset MSSQL_SA_PASSWORD
dotnet test Library-Management-System.Tests
```

Fish:

```fish
set -gx MSSQL_SA_PASSWORD (string replace -r '^MSSQL_SA_PASSWORD=' '' (cat dev/sqlserver.env))
set -gx GRANTHALAYA_TEST_SQL_CONNECTION "Server=127.0.0.1,14333;User Id=sa;Password=$MSSQL_SA_PASSWORD;Encrypt=True;TrustServerCertificate=True"
set -e MSSQL_SA_PASSWORD
dotnet test Library-Management-System.Tests
```

SQL tests use only new `Granthalaya_Test_*` / `Granthalaya_Identity_Test_*` databases. Confirm zero skipped tests. Without the variable, SQL-specific xUnit cases explicitly skip; that result is not complete relational verification.

## 7. Playwright journeys and curated screenshots

Keep the test connection from step 6 set. Install the user-scoped browser:

```bash
cd LMS-Frontend
npx playwright install chromium
cd ..
npm --prefix LMS-Frontend run test:e2e
# Optional: refresh neutral portfolio screenshots
npm --prefix LMS-Frontend run test:e2e -- --screenshots
# Optional: one journey
npm --prefix LMS-Frontend run test:e2e -- --grep 'Circulation'
```

The commands also work in Fish. [Playwright browser installation](https://playwright.dev/docs/browsers) downloads a browser. If it reports missing operating-system libraries, review `npx playwright install-deps chromium` and obtain approval before making host-level package changes. No host package installation was needed in this verification run; a cached Chromium executable was used.

For an existing compatible browser binary, set `GRANTHALAYA_BROWSER_EXECUTABLE` to its absolute path. Bash uses `export NAME=value`; Fish uses `set -gx NAME value`. This variable is optional and is not hardcoded in the runner.

The runner builds the helper, validates its generated database name, applies migrations, creates dedicated accounts with in-memory random credentials, builds the frontend, starts the real API on **5209** and its static Vite preview on **3100**, runs tests, stops its processes, and drops only its generated database. It fails if SQL configuration is missing or ports are unavailable; it never reuses an existing server on those ports. Ctrl+C triggers cleanup. A forced process kill or power failure can leave a `Granthalaya_E2E_*` database: inspect its exact generated name and remove only that disposable database.

Failure screenshots, traces, and logs are ignored under `artifacts/e2e/`; they may contain temporary test credentials. Share only the neutral `docs/screenshots/` captures after review.

Clear the environment when finished:

```bash
unset GRANTHALAYA_TEST_SQL_CONNECTION GRANTHALAYA_BROWSER_EXECUTABLE
```

```fish
set -e GRANTHALAYA_TEST_SQL_CONNECTION
set -e GRANTHALAYA_BROWSER_EXECUTABLE
```

## 8. Safe stop and restart

Stop API/frontend terminals with Ctrl+C. SQL Server has a 60-second stop grace period. For existing containers created with an older timeout, explicitly request it when stopping without removing the volume:

```bash
podman compose --env-file dev/sqlserver.env -f dev/compose.yaml stop --timeout 60
podman compose --env-file dev/sqlserver.env -f dev/compose.yaml start
podman ps --filter name=granthalaya-sqlserver-dev
```

Wait for **healthy**, then restart the API/frontend. `up -d` also recreates a missing container using the same named volume. Do not use `down -v`, `podman volume rm`, or delete the development database to run tests. Disposable test cleanup and persistent library-data deletion are separate operations.

## Final gates

```bash
dotnet restore Library-Management-System.Tests
dotnet build Library-Management-System
dotnet test Library-Management-System.Tests
dotnet ef migrations has-pending-model-changes --project Library-Management-System
npm --prefix LMS-Frontend ci
npm --prefix LMS-Frontend run lint
npm --prefix LMS-Frontend run build
npm --prefix LMS-Frontend audit --omit=dev
npm --prefix LMS-Frontend run test:e2e
git diff --check
```
