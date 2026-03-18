import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');

function readJson(relativePath) {
  const absolutePath = path.join(rootDir, relativePath);
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
}

function readText(relativePath) {
  const absolutePath = path.join(rootDir, relativePath);
  return fs.readFileSync(absolutePath, 'utf8');
}

function readEnvFile(relativePath) {
  const absolutePath = path.join(rootDir, relativePath);
  const content = fs.readFileSync(absolutePath, 'utf8');
  const entries = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    entries[key] = value;
  }

  return entries;
}

function normalizeText(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

const identity = readJson('deploy.identity.json');
const packageJson = readJson('package.json');
const firebaserc = readJson('.firebaserc');
const metadata = readJson('metadata.json');

const errors = [];
const warnings = [];

const deployTarget = process.env.DEPLOY_TARGET?.trim();
if (!deployTarget) {
  errors.push(
    `DEPLOY_TARGET nao foi informado. Use "npm run deploy:${identity.projectKey}" para publicar este projeto.`,
  );
} else if (deployTarget !== identity.projectKey) {
  errors.push(
    `DEPLOY_TARGET="${deployTarget}" nao corresponde a este repositorio. Esperado: "${identity.projectKey}".`,
  );
}

if (packageJson.name !== identity.packageName) {
  errors.push(
    `package.json aponta para "${packageJson.name}", mas a identidade esperada e "${identity.packageName}".`,
  );
}

const firebaseProjectId = firebaserc?.projects?.default;
if (firebaseProjectId !== identity.firebaseProjectId) {
  errors.push(
    `.firebaserc aponta para "${firebaseProjectId}", mas este projeto deve publicar em "${identity.firebaseProjectId}".`,
  );
}

const repoFolder = path.basename(rootDir);
if (repoFolder !== 'FL-CL-SSICO') {
  warnings.push(`Pasta atual "${repoFolder}" difere do nome esperado "FL-CL-SSICO".`);
}

const metadataName = normalizeText(metadata?.name ?? '');
if (metadataName !== normalizeText(identity.metadataName)) {
  errors.push(
    `metadata.json identifica "${metadata?.name ?? 'desconhecido'}", mas o esperado e "${identity.metadataName}".`,
  );
}

const indexHtml = readText('index.html');
const titleMatch = indexHtml.match(/<title>(.*?)<\/title>/is);
const title = titleMatch?.[1]?.trim() ?? '';
if (!normalizeText(title).includes(normalizeText(identity.htmlTitleIncludes))) {
  errors.push(
    `index.html tem titulo "${title || 'desconhecido'}", que nao corresponde a "${identity.htmlTitleIncludes}".`,
  );
}

const envPath = path.join(rootDir, '.env');
if (!fs.existsSync(envPath)) {
  errors.push('Arquivo .env nao encontrado. Sem ele nao da para validar o projeto de deploy.');
} else {
  const env = readEnvFile('.env');

  if (env.VITE_FIREBASE_PROJECT_ID !== identity.firebaseProjectId) {
    errors.push(
      `.env usa VITE_FIREBASE_PROJECT_ID="${env.VITE_FIREBASE_PROJECT_ID}", mas o esperado e "${identity.firebaseProjectId}".`,
    );
  }

  if (env.VITE_FIREBASE_AUTH_DOMAIN !== identity.firebaseAuthDomain) {
    errors.push(
      `.env usa VITE_FIREBASE_AUTH_DOMAIN="${env.VITE_FIREBASE_AUTH_DOMAIN}", mas o esperado e "${identity.firebaseAuthDomain}".`,
    );
  }

  if (env.VITE_FIREBASE_STORAGE_BUCKET !== identity.firebaseStorageBucket) {
    errors.push(
      `.env usa VITE_FIREBASE_STORAGE_BUCKET="${env.VITE_FIREBASE_STORAGE_BUCKET}", mas o esperado e "${identity.firebaseStorageBucket}".`,
    );
  }
}

if (warnings.length > 0) {
  console.warn('[deploy-guard] Avisos:');
  for (const warning of warnings) {
    console.warn(`  - ${warning}`);
  }
}

if (errors.length > 0) {
  console.error('[deploy-guard] Deploy bloqueado.');
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}

console.log(
  `[deploy-guard] Identidade validada: ${identity.displayName} -> Firebase ${identity.firebaseProjectId}.`,
);
