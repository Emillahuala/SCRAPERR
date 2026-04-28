import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} from 'recharts'
import type { PriceHistoryPoint } from '@/lib/mock-data'

interface PriceChartProps {
  data: PriceHistoryPoint[]
  avgPrice180d: number | null
}

function formatAxisDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-CL', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

function formatTooltipDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function PriceChart({ data, avgPrice180d }: PriceChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 rounded-lg border bg-card text-muted-foreground text-sm">
        Sin historial de precios disponible
      </div>
    )
  }

  // Sample every 5 days for readability on small screens
  const sampled = data.filter((_, i) => i % 5 === 0 || i === data.length - 1)

  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="text-sm font-semibold mb-4">Evolución de precios (USD)</h3>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={sampled} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="date"
            tickFormatter={formatAxisDate}
            tick={{ fontSize: 11 }}
            stroke="hsl(var(--muted-foreground))"
          />
          <YAxis
            tickFormatter={(v: number) => `$${v.toLocaleString('en-US')}`}
            tick={{ fontSize: 11 }}
            stroke="hsl(var(--muted-foreground))"
            width={72}
          />
          <Tooltip
            labelFormatter={(label: string) => formatTooltipDate(label)}
            formatter={(value: number) => [`$${value.toLocaleString('en-US')}`, '']}
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--card))',
              color: 'hsl(var(--card-foreground))',
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
          />
          {avgPrice180d != null && (
            <ReferenceLine
              y={avgPrice180d}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="6 3"
              label={{
                value: `Promedio ${avgPrice180d.toLocaleString('en-US')}`,
                position: 'insideTopRight',
                fontSize: 11,
                fill: 'hsl(var(--muted-foreground))',
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="avg_price"
            name="Precio prom."
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="min_price"
            name="Precio mín."
            stroke="#10b981"
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="4 2"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
