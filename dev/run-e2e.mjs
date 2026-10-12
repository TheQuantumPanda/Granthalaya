import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdir, open, readFile, unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createServer } from 'node:net';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!process.env.GRANTHALAYA_TEST_SQL_CONNECTION) throw new Error('Set GRANTHALAYA_TEST_SQL_CONNECTION to the local SQL Server test login.');
const database = `Granthalaya_E2E_${randomBytes(16).toString('hex')}`;
const password = `${randomBytes(24).toString('hex')}Aa1!`;
const connectionFile = path.join(root, 'artifacts/e2e', `connection-${database}.tmp`);
const ownerFile = path.join(root, 'artifacts/e2e', `owner-${database}.tmp`);
const env = { ...process.env, GRANTHALAYA_E2E_DB: database, GRANTHALAYA_E2E_PASSWORD: password, VITE_API_BASE_URL: 'http://127.0.0.1:5209',
  GRANTHALAYA_E2E_CONNECTION_FILE: connectionFile,
  GRANTHALAYA_E2E_OWNER_FILE: ownerFile,
  GRANTHALAYA_CAPTURE_SCREENSHOTS: process.argv.includes('--screenshots') ? '1' : '0' };
const helper = path.join(root, 'dev/Granthalaya.E2E/Granthalaya.E2E.csproj');
const children = [];
const logs = [];
let currentCommand;
process.on('SIGINT', () => {
  currentCommand?.kill('SIGTERM');
  for (const child of children) { try { process.kill(-child.pid, 'SIGTERM'); } catch {} }
});
const run = (command, args, cwd = root, commandEnv = env) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { cwd, env: commandEnv, stdio: 'inherit' });
  currentCommand = child;
  child.on('error', reject); child.on('exit', code => code === 0 ? resolve() : reject(new Error(`${command} exited with code ${code}`)));
});
async function start(command, args, options, name) {
  const log = await open(path.join(root, 'artifacts/e2e', `${name}.log`), 'w'); logs.push(log);
  const child = spawn(command, args, { ...options, detached: true, stdio: ['ignore', log.fd, log.fd] }); children.push(child);
  child.on('error', error => { console.error(`${name}: ${error.message}`); });
  return child;
}
async function ready(url, child) {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null || child.signalCode !== null) throw new Error(`Local server exited before becoming ready; inspect artifacts/e2e logs.`);
    try { const response = await fetch(url); if (response.status < 500) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Local server was not ready within 30 seconds: ${url}`);
}
let prepared = false;
let failure;
async function requireFreePort(port) {
  await new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once('error', () => reject(new Error(`Port ${port} is already in use; refusing to reuse any existing application.`)));
    probe.listen(port, '127.0.0.1', () => probe.close(resolve));
  });
}
try {
  await mkdir(path.join(root, 'artifacts/e2e'), { recursive: true });
  await run('dotnet', ['build', helper, '--verbosity', 'quiet']);
  await run('npm', ['run', 'build'], path.join(root, 'LMS-Frontend'));
  await Promise.all([requireFreePort(5209), requireFreePort(3100)]);
  prepared = true; // Cleanup also runs if preparation fails after CREATE DATABASE.
  await run('dotnet', ['run', '--project', helper, '--no-build', '--', 'prepare']);
  const connection = await readFile(connectionFile, 'utf8');
  await unlink(connectionFile);
  const apiEnv = { ...env, ConnectionStrings__DefaultConnection: connection, ASPNETCORE_ENVIRONMENT: 'Development',
      ASPNETCORE_URLS: 'http://127.0.0.1:5209', BootstrapAdmin__Enabled: 'false', SeedData__Enabled: 'false',
      Cors__AllowedOrigins__0: 'http://127.0.0.1:3100', Logging__LogLevel__Default: 'Warning' };
  await run('dotnet', ['run', '--project', path.join(root, 'Library-Management-System'), '--no-build', '--no-launch-profile', '--', '--bootstrap-admin'], root,
    { ...apiEnv, BootstrapAdmin__Enabled: 'true', BootstrapAdmin__Email: 'demo.admin@example.test', BootstrapAdmin__Password: password });
  const api = await start('dotnet', ['run', '--project', path.join(root, 'Library-Management-System'), '--no-build', '--no-launch-profile'], {
    cwd: root, env: apiEnv
  }, 'api');
  const frontend = await start('npm', ['exec', '--', 'vite', 'preview', '--host', '127.0.0.1', '--port', '3100', '--strictPort'], {
    cwd: path.join(root, 'LMS-Frontend'), env: { ...env, VITE_API_BASE_URL: 'http://127.0.0.1:5209' }
  }, 'frontend');
  await Promise.all([ready('http://127.0.0.1:5209/api/auth/me', api), ready('http://127.0.0.1:3100', frontend)]);
  await run('npm', ['exec', '--', 'playwright', 'test', ...process.argv.slice(2).filter(arg => arg !== '--screenshots')], path.join(root, 'LMS-Frontend'));
} catch (error) { failure = error; }
finally {
  for (const child of children) { try { process.kill(-child.pid, 'SIGTERM'); } catch {} }
  await Promise.all(children.map(child => child.exitCode !== null || child.signalCode !== null ? Promise.resolve() : new Promise(resolve => child.once('exit', resolve))));
  for (const log of logs) await log.close();
  await unlink(connectionFile).catch(() => {});
  if (prepared) {
    try { await run('dotnet', ['run', '--project', helper, '--no-build', '--', 'cleanup']); }
    catch (error) { console.error('Disposable database cleanup failed. Remove only the generated E2E database:', database); failure ??= error; }
  }
}
if (failure) { console.error(failure.message); process.exitCode = 1; }
