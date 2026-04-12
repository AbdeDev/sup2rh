/**
 * Répartit exactement 100 % entre des poids positifs, en pourcentages à une décimale
 * (méthode du plus grand reste sur les millième-de-pourcentage → dixièmes de %).
 * Évite les totaux ≠ 100 et les arrondis trompeurs (ex. plusieurs « 18 % » identiques
 * alors que les scores bruts diffèrent légèrement).
 */
export function distributePercentagesAmongWeights(weights: number[]): number[] {
  const n = weights.length;
  if (n === 0) return [];
  const safe = weights.map((w) => Math.max(0, Number(w) || 0));
  const sum = safe.reduce((a, b) => a + b, 0);
  if (sum <= 0) {
    const base = Math.floor(1000 / n);
    const tenths = Array.from({ length: n }, () => base);
    let r = 1000 - base * n;
    for (let i = 0; i < n && r > 0; i++, r--) tenths[i] += 1;
    return tenths.map((t) => t / 10);
  }

  const exactTenths = safe.map((w) => (w / sum) * 1000);
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

export function formatDomainPercent(value: number): string {
  if (value <= 0) return "—";
  return `${value.toFixed(1).replace(".", ",")} %`;
}
