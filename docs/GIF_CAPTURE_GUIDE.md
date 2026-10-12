# Granthalaya workflow GIFs — 12 October 2026

The README uses a dedicated typographic heading, a screenshot montage in the application-preview section, and two recordings of actual browser interactions. The recordings use the built React frontend, ASP.NET Core Identity/API, and a uniquely named disposable SQL Server database through the existing E2E runner. No backend responses, UI frames, or records are mocked.

## Published assets

| Asset under `docs/media/` | Dimensions | Duration | Playback | Size |
| --- | --- | --- | --- | --- |
| `granthalaya-header.gif` | 900 × 220 | 5.60 s | 10 FPS; 56 frames | 104,773 bytes |
| `granthalaya-preview.gif` | 840 × 615 | 12.06 s | Variable timing: 17 frames, 2.1 s slide holds and 130 ms transitions | 614,113 bytes |
| `catalog-copies.gif` | 1000 × 694 | 7.01 s | Approximately 8 FPS; 56 frames | 1,226,741 bytes |
| `circulation.gif` | 1000 × 694 | 14.51 s | Approximately 8 FPS; 116 frames | 3,156,813 bytes |

All four loop indefinitely. GIF timing uses hundredths of a second, so the recordings alternate 120/130 ms frame delays for approximately 8 FPS.

The screenshot montage is retained byte-for-byte from `Granthalaya-README-package.zip`, located in Downloads on the capture host. It was already extracted into the repository and matches the archive. It is a montage of genuine screenshots, not a recorded workflow.

**Inventory:** open the catalog, search Clean Code, inspect `DEMO-COPY-001`, enter `DEMO-COPY-009`, add the copy, and show the new accession and `2 / 2` availability.

**Circulation:** open Borrow Records, search an available title, select Demo Reader and `DEMO-COPY-008`, choose a due date 14 days ahead, issue the loan, show Borrowed status and unavailable inventory, confirm the return, show restored availability, and finish on the retained Returned history row.

The typographic heading uses Noto Serif with a static Noto Sans subtitle and a small outlined book. Its opaque warm off-white panel preserves contrast on both light and dark README backgrounds. The word remains legible throughout the reveal, holds in ink, then eases back to slate for a continuous loop. It contains no application screenshots.

## Reproduce safely

Follow [Local Setup](LOCAL_SETUP.md#7-playwright-journeys-and-curated-screenshots) to configure `GRANTHALAYA_TEST_SQL_CONNECTION` privately and start healthy SQL Server. Install the user-scoped recording helper if needed:

```bash
cd LMS-Frontend
npx playwright install chromium ffmpeg
cd ..
```

An existing compatible Chromium can instead be selected through `GRANTHALAYA_BROWSER_EXECUTABLE`, as documented in Local Setup. System FFmpeg and Python 3 are required for GIF encoding.

```bash
npm --prefix LMS-Frontend run test:e2e -- --config=playwright.capture.config.ts
python dev/encode-workflow-gifs.py
```

Run the encoder only after successful capture. The capture configuration discovers `e2e/workflows.capture.ts` explicitly; the ordinary five-journey suite does not discover this filename.

The runner creates a generated `Granthalaya_E2E_*` database with an ownership marker, seeds neutral records, provisions its temporary Admin through the real bootstrap CLI, starts the API/UI on 5209/3100, and removes only its identified database during cleanup. It does not reset the normal development database or change normal administrator credentials.

UI sign-in happens in an unrecorded context. The issued tab token is transferred in memory into the recording contexts, where the application validates it through the actual API. No password or token is typed or displayed during recording. Capture traces/screenshots are disabled; raw WebM videos and timing manifests remain ignored under `artifacts/e2e/recordings/`. Do not publish raw test logs or artifacts.

Recordings use **1440 × 1000** desktop Chromium. Assertions verify database-backed results before short presentation holds. The encoder trims the initial loading interval, scales to 1000 pixels wide, samples at 8 FPS, generates a 96-color palette, and uses Bayer dithering. It preserves the real action order and changes neither application logic nor recorded UI content. The screenshot montage is never re-encoded by the workflow encoder.

## Verification and limitations

Final media, link, and browser-playback checks completed on 13 October 2026.

- The opt-in capture journey passed, including inventory counts, issued/returned status, restored availability, preserved history, and viewport-width checks.
- The ordinary five Chromium journeys passed afterward; frontend lint and the runner's frontend/backend-helper builds passed.
- All GIF frames decoded; dimensions, delays, duration, and infinite-loop metadata were checked. Representative beginning, intermediate, and final frames were visually reviewed. Browser playback and README media/link checks were also performed.
- Only neutral demonstration names and `example.test` addresses appear. No login fields, tokens, connection strings, or persistent personal records appear in the published GIFs.
- This is a desktop Chromium recording, without audio. The preview montage is a slideshow; the separate typographic heading gently deepens its lettering from slate to ink. The circulation clip is longer than the inventory clip to retain inventory changes and the complete return/history sequence.
- Local rendering and relative paths were checked; no GitHub upload or hosted-demo verification was performed. No commits or pushes were made.

Preview individual GIFs in a browser. For a GitHub-like README view, use an editor's Markdown preview (for example, VS Code's **Markdown: Open Preview to the Side**). On GitHub, open the repository README once these files are included in the same branch; the paths are relative to the repository root.
