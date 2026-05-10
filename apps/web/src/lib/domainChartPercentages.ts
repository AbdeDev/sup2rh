const DOMAIN_SCORE_DECAY = 0.65;
const AFFINITY_SOFTMAX_SCALE = 0.4;
const MIN_MEANINGFUL_RANGE_RATIO = 0.05;

/**
 * Calcule l'affinité d'un domaine depuis tous ses métiers scorés.
 *
 * On ne prend plus seulement le meilleur métier : sinon plusieurs domaines
 * peuvent afficher la même valeur alors que les autres métiers du domaine
 * racontent une histoire différente. Le meilleur métier compte le plus, puis
 * les suivants comptent avec un poids décroissant pour ne pas favoriser les
 * domaines qui ont simplement plus de fiches.
 */
export function calculateDomainAffinityScore(scores: number[]): number {
  const sorted = scores
    .map((score) => Math.max(0, Number(score) || 0))
    .filter((score) => score > 0)
    .sort((a, b) => b - a);

  if (sorted.length === 0) return 0;

  let weightedScore = 0;
  let weightSum = 0;
  for (let i = 0; i < sorted.length; i++) {
    const weight = DOMAIN_SCORE_DECAY ** i;
    weightedScore += sorted[i]! * weight;
    weightSum += weight;
  }

  return weightedScore / weightSum;
}

function largestRemainderTo1000(amplified: number[]): number[] {
  const sum = amplified.reduce((a, b) => a + b, 0) || 1;
  const exactTenths = amplified.map((w) => (w / sum) * 1000);
  const floors = exactTenths.map((t) => Math.floor(t + 1e-9));
  let remainder = 1000 - floors.reduce((a, b) => a + b, 0);
  const order = exactTenths
    .map((t, i) => ({ i, frac: t - floors[i]! }))
    .sort((a, b) => b.frac - a.frac);
  const out = [...floors];
  let k = 0;
  while (remainder > 0 && k < order.length) {
    out[order[k]!.i] += 1;
    remainder -= 1;
    k += 1;
  }
  return out.map((t) => Math.round(t) / 10);
}

export function distributePercentagesAmongWeights(weights: number[]): number[] {
  const n = weights.length;
  if (n === 0) return [];
  if (n === 1) return [100];

  const safe = weights.map((w) => Math.max(0, Number(w) || 0));
  const sum = safe.reduce((a, b) => a + b, 0);

  // Tous nuls → parts égales
  if (sum <= 0) {
    const base = Math.floor(1000 / n);
    const tenths = Array.from({ length: n }, () => base);
    let r = 1000 - base * n;
    for (let i = 0; i < n && r > 0; i++, r--) tenths[i] += 1;
    return tenths.map((t) => t / 10);
  }

  const min = Math.min(...safe);
  const max = Math.max(...safe);
  const range = max - min;

  // Tous identiques → parts égales : on ne fabrique pas d'écart qui n'existe pas.
  if (range < 1e-9) {
    const base = Math.floor(1000 / n);
    const tenths = Array.from({ length: n }, () => base);
    let r = 1000 - base * n;
    for (let i = 0; i < n && r > 0; i++, r--) tenths[i] += 1;
    return tenths.map((t) => t / 10);
  }

  if (range / max < MIN_MEANINGFUL_RANGE_RATIO) {
    return largestRemainderTo1000(safe);
  }

  const mean = sum / n;
  const variance = safe.reduce((acc, value) => acc + (value - mean) ** 2, 0) / n;
  const std = Math.sqrt(variance) || 1;
  const affinityWeights = safe.map((value) =>
    Math.exp(((value - mean) / std) * AFFINITY_SOFTMAX_SCALE),
  );

  return largestRemainderTo1000(affinityWeights);
}

export function formatDomainPercent(value: number): string {
  if (value <= 0) return "—";
  // Arrondi à l'entier si .0 (moins de bruit visuel), sinon une décimale
  return value % 1 === 0 ? `${value} %` : `${value.toFixed(1).replace(".", ",")} %`;
}
