import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const identity = JSON.parse(fs.readFileSync(path.join(rootDir, 'deploy.identity.json'), 'utf8'));

console.error(`[deploy] Comando generico bloqueado neste repositorio.`);
console.error(`[deploy] Use "npm run deploy:${identity.projectKey}" para publicar ${identity.displayName}.`);
process.exit(1);
