import { KpiCards } from './KpiCards'
import { TrendChart } from './TrendChart'
import { SeasonalityHeatmap } from './SeasonalityHeatmap'

export function InsightsPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">📊 Insights</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Métricas y tendencias del mercado de cruceros en tiempo real
        </p>
      </div>

      {/* KPI cards */}
      <section aria-labelledby="kpi-heading">
        <h2 id="kpi-heading" className="sr-only">
          Métricas clave
        </h2>
        <KpiCards />
      </section>

      {/* Trend chart */}
      <section aria-labelledby="trend-heading">
        <h2 id="trend-heading" className="sr-only">
          Tendencia de precios
        </h2>
        <TrendChart />
      </section>

      {/* Seasonality heatmap */}
      <section aria-labelledby="heatmap-heading">
        <h2 id="heatmap-heading" className="sr-only">
          Estacionalidad
        </h2>
        <SeasonalityHeatmap />
      </section>
    </div>
  )
}
