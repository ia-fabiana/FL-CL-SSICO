import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const identity = JSON.parse(fs.readFileSync(path.join(rootDir, 'deploy.identity.json'), 'utf8'));

const firebaseCommand = process.platform === 'win32' ? 'firebase.cmd' : 'firebase';

console.log(
  `[deploy] Publicando ${identity.displayName} no projeto Firebase ${identity.firebaseProjectId}.`,
);

const result = spawnSync(firebaseCommand, ['deploy', '--only', 'hosting'], {
  cwd: rootDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    DEPLOY_TARGET: identity.projectKey,
  },
});

if (result.error) {
  console.error(`[deploy] Falha ao executar o Firebase CLI: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
