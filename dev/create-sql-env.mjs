// Creates an ignored credential file once. Existing credentials are never overwritten.
import { randomBytes } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const target = fileURLToPath(new URL('./sqlserver.env', import.meta.url));
try {
  await writeFile(target, `MSSQL_SA_PASSWORD=${randomBytes(32).toString('hex')}Aa1!\n`, { flag: 'wx', mode: 0o600 });
  console.log('Created dev/sqlserver.env with owner-only permissions. Keep it private.');
} catch (error) {
  if (error.code === 'EEXIST') console.log('dev/sqlserver.env already exists; preserved existing credentials.');
  else throw error;
}
