export const PRIORITY_LABELS: Record<number, string> = {
  1: 'Non Critical',
  2: 'Moderate',
  3: 'Important',
  4: 'Critical',
};

// Urgency palette — warm (amber / orange / red)
export const URGENCY_COLORS: Record<number, { bg: string; color: string; border: string }> = {
  1: { bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' },
  2: { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
  3: { bg: '#ffedd5', color: '#9a3412', border: '#fed7aa' },
  4: { bg: '#fee2e2', color: '#991b1b', border: '#fecaca' },
};

export const URGENCY_COLORS_DARK: Record<number, { bg: string; color: string; border: string }> = {
  1: { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8', border: 'rgba(148,163,184,0.2)' },
  2: { bg: 'rgba(251,191,36,0.15)', color: '#fcd34d', border: 'rgba(252,211,77,0.25)' },
  3: { bg: 'rgba(249,115,22,0.15)', color: '#fb923c', border: 'rgba(251,146,60,0.25)' },
  4: { bg: 'rgba(239,68,68,0.18)', color: '#fca5a5', border: 'rgba(252,165,165,0.3)' },
};

// Importance palette — cool (sky / indigo / violet)
export const IMPORTANCE_COLORS: Record<number, { bg: string; color: string; border: string }> = {
  1: { bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' },
  2: { bg: '#e0f2fe', color: '#0c4a6e', border: '#bae6fd' },
  3: { bg: '#e0e7ff', color: '#3730a3', border: '#c7d2fe' },
  4: { bg: '#ede9fe', color: '#5b21b6', border: '#ddd6fe' },
};

export const IMPORTANCE_COLORS_DARK: Record<number, { bg: string; color: string; border: string }> = {
  1: { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8', border: 'rgba(148,163,184,0.2)' },
  2: { bg: 'rgba(14,165,233,0.15)', color: '#7dd3fc', border: 'rgba(125,211,252,0.25)' },
  3: { bg: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: 'rgba(165,180,252,0.25)' },
  4: { bg: 'rgba(139,92,246,0.18)', color: '#c4b5fd', border: 'rgba(196,181,253,0.3)' },
};

// Backwards compat helper (used in tests if needed)
export const PRIORITY_COLORS = URGENCY_COLORS;
export const PRIORITY_COLORS_DARK = URGENCY_COLORS_DARK;

export function getPriorityLabel(level: number): string {
  return PRIORITY_LABELS[level] ?? 'Moderate';
}

export function getUrgencyMeta(level: number, isDark = false) {
  const map = isDark ? URGENCY_COLORS_DARK : URGENCY_COLORS;
  return map[level] ?? map[2]!;
}

export function getImportanceMeta(level: number, isDark = false) {
  const map = isDark ? IMPORTANCE_COLORS_DARK : IMPORTANCE_COLORS;
  return map[level] ?? map[2]!;
}

// Legacy shim
export function getPriorityMeta(level: number, isDark = false) {
  return getUrgencyMeta(level, isDark);
}

export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
