const storageKey = (userId) => `meassist_consultations_v1_${userId}`;

export function defaultConsultationStore() {
  return { orderedIds: [], byId: {}, activeId: null };
}

export function loadConsultationStore(userId) {
  if (!userId) return defaultConsultationStore();
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return defaultConsultationStore();
    const data = JSON.parse(raw);
    if (!data.byId || !Array.isArray(data.orderedIds)) return defaultConsultationStore();
    return data;
  } catch {
    return defaultConsultationStore();
  }
}

export function saveConsultationStore(userId, store) {
  if (!userId) return;
  localStorage.setItem(storageKey(userId), JSON.stringify(store));
}

export function serializeMessages(messages) {
  return messages.map((m) => ({
    ...m,
    timestamp:
      m.timestamp instanceof Date
        ? m.timestamp.toISOString()
        : typeof m.timestamp === 'string'
          ? m.timestamp
          : new Date().toISOString(),
  }));
}

export function reviveMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages.map((m) => ({
    ...m,
    timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
  }));
}

export function consultationTitleFromMessages(messages) {
  const firstUser = messages.find((m) => m.role === 'user');
  if (firstUser?.text) {
    const t = firstUser.text.trim();
    return t.length > 48 ? `${t.slice(0, 45)}…` : t;
  }
  const firstAi = messages.find((m) => m.role === 'ai' && !m.structured);
  if (firstAi?.text) {
    const t = firstAi.text.trim().split('\n')[0];
    return t.length > 48 ? `${t.slice(0, 45)}…` : t;
  }
  return 'New consultation';
}

export function riskFromMessages(messages) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const r = messages[i].structured?.riskLevel;
    if (r) return String(r).toLowerCase();
  }
  return 'low';
}

export function formatRelativeTime(isoOrDate) {
  const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return '';
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 45) return 'Just now';
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 604800) return `${Math.floor(sec / 86400)}d ago`;
  return d.toLocaleDateString();
}

export function upsertConsultationInStore(store, { id, sessionId, messages }) {
  const serialized = serializeMessages(messages);
  const title = consultationTitleFromMessages(messages);
  const riskLevel = riskFromMessages(messages);
  const updatedAt = new Date().toISOString();
  store.byId[id] = {
    sessionId,
    title,
    riskLevel,
    updatedAt,
    messages: serialized,
  };
  if (!store.orderedIds.includes(id)) {
    store.orderedIds.unshift(id);
  } else {
    store.orderedIds = [id, ...store.orderedIds.filter((x) => x !== id)];
  }
  return store;
}

export function summariesFromStore(store) {
  return store.orderedIds.map((id) => {
    const row = store.byId[id];
    return {
      id,
      title: row?.title || 'Consultation',
      time: formatRelativeTime(row?.updatedAt),
      risk: row?.riskLevel || 'low',
    };
  });
}

export function latestInsightsFromMessages(messages) {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].structured) return messages[i].structured;
  }
  return null;
}
