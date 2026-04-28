interface KpiProps {
  label: string
  value: string
  sub?: string
  highlight?: boolean
}

function Kpi({ label, value, sub, highlight = false }: KpiProps) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border bg-card p-4">
      <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
      <span
        className={`text-2xl font-bold ${highlight ? 'text-emerald-600 dark:text-emerald-400' : ''}`}
      >
        {value}
      </span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  )
}

interface KpiRowProps {
  currentPrice: number | null
  avgPrice: number | null
  zScore: number | null
  dealScore: number | null
  daysToDeparture: number | null
}

export function KpiRow({
  currentPrice,
  avgPrice,
  zScore,
  dealScore,
  daysToDeparture,
}: KpiRowProps) {
  const savings =
    avgPrice && currentPrice && avgPrice > currentPrice
      ? Math.round(((avgPrice - currentPrice) / avgPrice) * 100)
      : 0

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <Kpi
        label="Precio actual"
        value={currentPrice != null ? `$${currentPrice.toLocaleString('en-US')}` : '—'}
        highlight={savings > 0}
      />
      <Kpi
        label="Promedio 180d"
        value={avgPrice != null ? `$${avgPrice.toLocaleString('en-US')}` : '—'}
        sub="precio de referencia"
      />
      <Kpi
        label="Ahorro estimado"
        value={savings > 0 ? `${savings} %` : '—'}
        highlight={savings > 0}
      />
      <Kpi
        label="Z-score"
        value={zScore != null ? `${zScore.toFixed(2)}σ` : '—'}
        sub="desviaciones del promedio"
        highlight={(zScore ?? 0) < -2}
      />
      <Kpi
        label="Deal score"
        value={dealScore != null ? String(dealScore) : '—'}
        sub={
          dealScore != null
            ? dealScore >= 80
              ? 'Ofertón 🔥'
              : dealScore >= 60
                ? 'Buena oferta ✅'
                : 'Precio normal'
            : undefined
        }
        highlight={(dealScore ?? 0) >= 60}
      />
      {daysToDeparture != null && (
        <Kpi label="Días para zarpe" value={String(daysToDeparture)} sub="días restantes" />
      )}
    </div>
  )
}
