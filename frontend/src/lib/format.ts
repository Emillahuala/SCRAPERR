/** Formatters for money, dates, and numeric values. */

const USD_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const CLP_FORMAT = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
})

const DATE_FORMAT = new Intl.DateTimeFormat('es-CL', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

/** Format a USD amount: $1,234 */
export function formatUSD(amount: number | null | undefined): string {
  if (amount == null) return '—'
  return USD_FORMAT.format(amount)
}

/** Format a CLP amount: $1.234.567 */
export function formatCLP(amount: number | null | undefined): string {
  if (amount == null) return '—'
  return CLP_FORMAT.format(amount)
}

/**
 * Format an ISO date string (YYYY-MM-DD) to a locale-friendly string.
 * e.g. "22 may 2026"
 */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return DATE_FORMAT.format(new Date(iso))
}

/** Format a Z-score to two decimal places with sign. */
export function formatZScore(z: number | null | undefined): string {
  if (z == null) return '—'
  const sign = z > 0 ? '+' : ''
  return `${sign}${z.toFixed(2)}σ`
}

/** Format a percentage saving: "−23 %" */
export function formatSavings(current: number, avg: number | null): string {
  if (!avg || avg <= 0) return '—'
  const pct = ((avg - current) / avg) * 100
  return `−${Math.round(Math.abs(pct))} %`
}

/** Format duration in nights: "7 noches" */
export function formatNights(n: number | null | undefined): string {
  if (n == null) return '—'
  return `${n} ${n === 1 ? 'noche' : 'noches'}`
}

const MIN_SAMPLES = 10

/** Format deal score as a human label. Requires at least MIN_SAMPLES captures to be reliable. */
export function dealScoreLabel(
  score: number | null | undefined,
  sampleCount: number | null | undefined,
): string {
  if ((sampleCount ?? 0) < MIN_SAMPLES) return '⏳ Datos insuficientes'
  if (score == null) return 'Sin datos'
  if (score >= 80) return '🔥 Ofertón'
  if (score >= 60) return '✅ Buena oferta'
  if (score >= 40) return '👍 Precio ok'
  return '😐 Precio normal'
}
