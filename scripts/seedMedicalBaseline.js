/**
 * Seeds local symptom + triage reference into a user's training_corpus.json
 * (and vector store when GEMINI_API_KEY works).
 *
 * Usage:
 *   node scripts/seedMedicalBaseline.js <userId>
 *   node scripts/seedMedicalBaseline.js --all-users
 *
 * Idempotent per user: skips if corpus already contains source medical_baseline_v1.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { processRawText } = require('../services/ragService');
const { SYMPTOM_TRAINING_DATASET } = require('../train_script');

const BASELINE_SOURCE = 'medical_baseline_v1';
const DOCS_DIR = path.join(__dirname, '../data/medical_docs');

function getCorpusPath(userId) {
  return path.join(__dirname, `../data/user_${userId}/training_corpus.json`);
}

function isAlreadySeeded(userId) {
  const p = getCorpusPath(userId);
  if (!fs.existsSync(p)) return false;
  try {
    const rows = JSON.parse(fs.readFileSync(p, 'utf8'));
    return Array.isArray(rows) && rows.some((r) => r.source === BASELINE_SOURCE);
  } catch {
    return false;
  }
}

function collectMedicalDocText() {
  if (!fs.existsSync(DOCS_DIR)) {
    console.warn(`[Seed] No folder ${DOCS_DIR}`);
    return '';
  }
  const parts = [];
  for (const name of fs.readdirSync(DOCS_DIR)) {
    if (!name.toLowerCase().endsWith('.txt')) continue;
    const full = path.join(DOCS_DIR, name);
    try {
      parts.push(`\n--- ${name} ---\n${fs.readFileSync(full, 'utf8')}`);
    } catch (e) {
      console.warn(`[Seed] Skip ${name}:`, e.message);
    }
  }
  return parts.join('\n');
}

function discoverUserIds() {
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) return [];
  return fs
    .readdirSync(dataDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.startsWith('user_'))
    .map((d) => d.name.replace(/^user_/, ''));
}

async function seedUser(userId, { force }) {
  if (!force && isAlreadySeeded(userId)) {
    console.log(`[Seed] Skip user ${userId} (already has ${BASELINE_SOURCE})`);
    return 0;
  }

  const docBundle = collectMedicalDocText();
  const combined = [
    SYMPTOM_TRAINING_DATASET.trim(),
    '',
    '--- Bundled reference files (medical_docs) ---',
    docBundle,
  ].join('\n');

  if (combined.trim().length < 20) {
    console.error('[Seed] No content to train — add files under data/medical_docs');
    return 0;
  }

  console.log(`[Seed] Ingesting baseline for user ${userId} (${combined.length} chars)...`);
  const chunks = await processRawText(userId, combined, BASELINE_SOURCE);
  console.log(`[Seed] User ${userId}: ${chunks} chunks stored.`);
  return chunks;
}

async function main() {
  const arg = process.argv[2];
  const force = process.argv.includes('--force');

  if (!arg) {
    console.error('Usage: node scripts/seedMedicalBaseline.js <userId> [--force]');
    console.error('   or: node scripts/seedMedicalBaseline.js --all-users [--force]');
    process.exit(1);
  }

  if (arg === '--all-users') {
    const ids = discoverUserIds();
    if (ids.length === 0) {
      console.log('[Seed] No user_* folders under backend/data yet. Create an account via the app first, or seed a UUID manually.');
      process.exit(0);
    }
    let total = 0;
    for (const id of ids) {
      total += await seedUser(id, { force });
    }
    console.log(`[Seed] Finished --all-users (${ids.length} accounts).`);
    return;
  }

  await seedUser(arg, { force });
}

main().catch((err) => {
  console.error('[Seed] Failed:', err);
  process.exit(1);
});
