const { getVectorStore } = require('./vectorStore');
const fs = require('fs');
const path = require('path');

const VECTOR_SEARCH_TIMEOUT_MS = Number(process.env.VECTOR_SEARCH_TIMEOUT_MS || 2500);
const ENABLE_VECTOR_FALLBACK = process.env.ENABLE_VECTOR_FALLBACK === 'true';

const corpusCache = new Map();

const STOPWORDS = new Set([
  'what', 'when', 'where', 'why', 'how', 'who', 'which', 'tell', 'about',
  'explain', 'define', 'does', 'did', 'can', 'could', 'would', 'should',
  'the', 'and', 'for', 'with', 'from', 'this', 'that', 'are', 'was', 'were',
  'have', 'has', 'had', 'you', 'your', 'please', 'symptom', 'symptoms',
  'sign', 'signs', 'feel', 'feeling', 'felt', 'having', 'suffering'
]);

const CATEGORY_PATTERNS = [
  ['abdominal', /\b(stomach|abdominal|abdomen|belly|gas|bloating|indigestion|acidity|vomit|vomiting|nausea|diarrhea|constipation|cramp|loose motion|loose motions)\b/],
  ['skin', /\b(rash|skin|itch|itching|hives|blister|peeling|swelling|redness|spots)\b/],
  ['respiratory', /\b(cough|cold|flu|sore throat|throat pain|runny nose|blocked nose|stuffy nose|mucus|wheez|breath|breathing|congestion)\b/],
  ['fever', /\b(fever|feverish|temperature|temp|high temp|chills|shivering|body ache|body aches)\b/],
  ['headache', /\b(headache|head ache|head pain|migraine|sinus headache|pressure in head)\b/],
  ['chest_pain', /\b(chest|heart|angina)\b/],
  ['dizziness', /\b(dizzy|dizziness|vertigo|faint|lightheaded|light headed)\b/],
];

const QUERY_SYNONYMS = {
  fever: ['feverish', 'temperature', 'temp', 'chills', 'shivering'],
  feverish: ['fever', 'temperature', 'chills'],
  temperature: ['fever', 'feverish', 'chills'],
  chills: ['fever', 'temperature', 'shivering'],
  headache: ['head', 'migraine', 'sinus'],
  migraine: ['headache', 'head'],
  cough: ['cold', 'throat', 'mucus', 'respiratory'],
  cold: ['cough', 'fever', 'runny', 'nose', 'throat', 'flu'],
  flu: ['fever', 'cold', 'cough'],
  throat: ['sore', 'cough', 'cold'],
  stomach: ['abdominal', 'abdomen', 'belly', 'nausea', 'vomiting'],
  belly: ['stomach', 'abdominal', 'abdomen'],
  vomit: ['vomiting', 'nausea', 'stomach'],
  vomiting: ['vomit', 'nausea', 'stomach'],
  dizzy: ['dizziness', 'vertigo', 'lightheaded'],
  dizziness: ['dizzy', 'vertigo', 'lightheaded'],
  rash: ['skin', 'itch', 'itching', 'redness'],
  itch: ['itching', 'rash', 'skin'],
  itching: ['itch', 'rash', 'skin']
};

const getCorpusPath = (userId) => {
  return path.join(__dirname, `../data/user_${userId}/training_corpus.json`);
};

const getGlobalCorpusPath = () => {
  return path.join(__dirname, '../data/training_corpus.json');
};

const tokenize = (text) => String(text || '')
  .toLowerCase()
  .split(/[^a-z0-9]+/)
  .filter((word) => word.length > 2 && !STOPWORDS.has(word));

const expandQueryTokens = (tokens) => {
  const expanded = new Set(tokens);
  tokens.forEach((token) => {
    (QUERY_SYNONYMS[token] || []).forEach((synonym) => {
      if (!STOPWORDS.has(synonym)) expanded.add(synonym);
    });
  });
  return expanded;
};

const detectCategories = (text) => {
  const lower = String(text || '').toLowerCase();
  return CATEGORY_PATTERNS
    .filter(([, pattern]) => pattern.test(lower))
    .map(([category]) => category);
};

const detectCategory = (text) => {
  return detectCategories(text)[0] || 'general';
};

const hasUsefulOverlap = (entry, queryTokens, queryCategories) => {
  const text = String(entry?.text || '');
  const textLower = text.toLowerCase();
  const textTokens = new Set(tokenize(text));
  const entryCategory = entry.category || detectCategory(text);

  const tokenMatches = Array.from(queryTokens).filter((token) => (
    textTokens.has(token) || (token.length >= 4 && textLower.includes(token))
  ));
  const categoryMatches = queryCategories.size > 0 && queryCategories.has(entryCategory);

  return {
    ok: tokenMatches.length > 0 || categoryMatches,
    tokenMatches: tokenMatches.length,
    categoryMatches,
    entryCategory
  };
};

const sourcePriority = (entry) => {
  const source = String(entry?.source || '');
  if (source === 'medical_baseline_v1') return 30;
  if (source === 'user_training') return 20;
  if (!/\.(pdf|docx?|xlsx?|csv)$/i.test(source)) return 10;
  return 0;
};

const readCorpus = (corpusPath) => {
  if (!fs.existsSync(corpusPath)) {
    return [];
  }

  try {
    const stat = fs.statSync(corpusPath);
    const cached = corpusCache.get(corpusPath);
    if (cached && cached.mtimeMs === stat.mtimeMs && cached.size === stat.size) {
      return cached.data;
    }

    const parsed = JSON.parse(fs.readFileSync(corpusPath, 'utf8'));
    const data = Array.isArray(parsed) ? parsed : [];
    corpusCache.set(corpusPath, {
      mtimeMs: stat.mtimeMs,
      size: stat.size,
      data
    });
    console.log(`[Retriever] Loaded corpus cache: ${path.basename(corpusPath)} (${data.length} entries).`);
    return data;
  } catch (err) {
    console.error(`[Retriever] Error reading corpus ${corpusPath}:`, err.message);
    return [];
  }
};

const withTimeout = (promise, timeoutMs, label) => {
  let timeout;
  const timeoutPromise = new Promise((_, reject) => {
    timeout = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeout));
};

const retrieveFromCorpus = (corpus, query, k = 6, defaultSource = 'knowledge_base') => {
  try {
    const rawQueryTokens = tokenize(query);
    const queryTokens = expandQueryTokens(rawQueryTokens);
    const queryPhrase = Array.from(queryTokens).join(' ');
    const queryCategories = new Set(detectCategories(query));
    const queryCategory = Array.from(queryCategories)[0] || 'general';

    if (queryTokens.size === 0) return [];

    const scored = [];

    corpus.forEach((entry) => {
        const text = String(entry.text || '');
        const textLower = text.toLowerCase();
        const overlap = hasUsefulOverlap(entry, queryTokens, queryCategories);
        if (!overlap.ok) {
          return;
        }

        const textTokens = new Set(tokenize(text));
        const entryCategory = overlap.entryCategory;
        let score = 0;

        queryTokens.forEach((token) => {
          const definitionPattern = new RegExp(`\\b${token}\\s+(is|are|means|refers)\\b`);
          // Exact token match
          if (textTokens.has(token)) {
            score += 2;
          }
          // Substring match (partial)
          else if (textLower.includes(token)) {
            score += 1;
          }
          if (textLower.startsWith(token) || definitionPattern.test(textLower)) {
            score += 10;
          }
          if (token.length >= 7 && textTokens.has(token)) {
            score += 8;
          }
        });

        if (queryPhrase && textLower.includes(queryPhrase)) {
          score += 6;
        }

        if (queryCategories.size > 0 && queryCategories.has(entryCategory)) {
          score += 8;
        }
        if (queryCategories.size > 0 && !queryCategories.has(entryCategory) && entryCategory !== 'general') {
          score -= 12;
        }
        if (queryCategories.size > 0 && entryCategory === 'general') {
          score -= 4;
        }
        if (overlap.tokenMatches > 1) {
          score += overlap.tokenMatches * 2;
        }

        // Boost score by coverage ratio (how many query terms matched)
        const coverage = score / (queryTokens.size * 2);
        if (score < 2) return;

        scored.push({
          ...entry,
          source: entry.source || defaultSource,
          category: entryCategory,
          type: entry.type || 'note',
          score: score + coverage
        });
      });

    const topScored = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, k);

    const groupIds = new Set(topScored.map((entry) => entry.groupId).filter(Boolean));
    const siblings = corpus
      .filter((entry) => groupIds.has(entry.groupId))
      .map((entry) => {
        const overlap = hasUsefulOverlap(entry, queryTokens, queryCategories);
        return {
          ...entry,
          category: entry.category || detectCategory(entry.text),
          type: entry.type || 'note',
          score: (overlap.categoryMatches ? 4 : 0) + overlap.tokenMatches
        };
      })
      .filter((entry) => entry.score > 0);

    const byId = new Map();
    [...topScored, ...siblings].forEach((entry) => {
      byId.set(entry.id || entry.text, entry);
    });

    return Array.from(byId.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, k + 6);
  } catch (err) {
    console.error('[Retriever] Error searching corpus:', err.message);
    return [];
  }
};

const retrieveLocalCorpus = (userId, query, k = 6) => {
  return retrieveFromCorpus(readCorpus(getCorpusPath(userId)), query, k, 'user_training');
};

const retrieveGlobalCorpus = (query, k = 6) => {
  return retrieveFromCorpus(readCorpus(getGlobalCorpusPath()), query, k, 'baseline_medical_knowledge');
};

async function retrieveContext(userId, query, k = 6) {
  const startTime = Date.now();
  console.log(`[Retriever] Searching for: "${query}" for user ${userId}...`);

  const contextTexts = [];
  const sources = new Set();

  // ── Local corpus search (always fast, always works) ──────────────────────
  const localResults = retrieveLocalCorpus(userId, query, k);
  const globalResults = retrieveGlobalCorpus(query, k);
  const mergedLocalResults = [...localResults, ...globalResults];

  mergedLocalResults.forEach((entry) => {
    contextTexts.push({
      text: entry.text,
      source: entry.source,
      groupId: entry.groupId,
      category: entry.category,
      type: entry.type,
      score: entry.score
    });
    if (entry.source) sources.add(entry.source);
  });

  if (mergedLocalResults.length > 0) {
    console.log(`[Retriever] Found ${localResults.length} user matches and ${globalResults.length} baseline matches from local corpus.`);
  }

  // ── Vector store search (semantic, optional) ─────────────────────────────
  // Gemini embedding quota can block this path. For demo/submission stability,
  // only use it when explicitly enabled or when the JSON corpus found nothing.
  const shouldUseVectorStore = ENABLE_VECTOR_FALLBACK || mergedLocalResults.length === 0;
  if (shouldUseVectorStore) {
    try {
      const store = await withTimeout(getVectorStore(userId), VECTOR_SEARCH_TIMEOUT_MS, 'Vector store load');
      if (store) {
        const results = await withTimeout(store.similaritySearch(query, k), VECTOR_SEARCH_TIMEOUT_MS, 'Vector search');
      
        const queryCategory = detectCategory(query);
        results.forEach(doc => {
          if (doc.metadata?.source === 'system' || doc.pageContent === 'Initialization dummy text') {
            return;
          }
          const docCategory = detectCategory(doc.pageContent);
          if (queryCategory !== 'general' && docCategory !== queryCategory) {
            return;
          }
          // Avoid duplicates from local corpus
          if (!contextTexts.some((entry) => entry.text === doc.pageContent)) {
            contextTexts.push({
              text: doc.pageContent,
              source: doc.metadata?.source,
              category: doc.metadata?.category || docCategory,
              type: doc.metadata?.type || 'note',
              score: 0
            });
          }
          if (doc.metadata && doc.metadata.source) {
            const filename = doc.metadata.source.split('/').pop().split('\\').pop();
            sources.add(filename);
          }
        });

        console.log(`[Retriever] Found ${results.length} matches from vector store.`);
      }
    } catch (error) {
      console.warn('[Retriever] Vector store search skipped, using local corpus only:', error.message);
    }
  } else {
    console.log('[Retriever] Skipping vector store; local corpus returned enough matches.');
  }

  // ── Keyword-overlap filter: remove semantically similar but topically unrelated docs ──
  // This is the core anti-hallucination guard for the vector store results.
  const queryWords = expandQueryTokens(tokenize(query));
  const queryCategories = new Set(detectCategories(query));

  const vectorFiltered = contextTexts.filter(entry => {
    return hasUsefulOverlap(entry, queryWords, queryCategories).ok;
  });

  // If filtering removed everything, fall back gracefully to unfiltered but limited set
  const finalContext = vectorFiltered.length > 0
    ? vectorFiltered
      .sort((a, b) => (sourcePriority(b) + (b.score || 0)) - (sourcePriority(a) + (a.score || 0)))
      .slice(0, k + 6)
    : contextTexts.slice(0, 3);
  const finalSources = Array.from(new Set(finalContext.map((entry) => entry.source).filter(Boolean)));

  const elapsed = Date.now() - startTime;
  console.log(`[Retriever] Total: ${finalContext.length} chunks (after keyword filter) in ${elapsed}ms.`);

  return {
    context: finalContext,
    sources: finalSources
  };
}

/**
 * hasEnoughContext — safety gate before sending to AI.
 * Returns false if retrieved context is too sparse to reason from.
 * Used to decide whether to use RAG or Gemini fallback.
 */
function hasEnoughContext(contextTexts, minChars = 50) {
  const combined = contextTexts.map(c => c.text || '').join(' ').trim();
  return combined.length >= minChars;
}

module.exports = {
  retrieveContext,
  hasEnoughContext
};
