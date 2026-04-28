import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import { useTrend } from './useInsights'

const REGION_COLORS: Record<string, string> = {
  caribe: '#0891b2',      // cyan-600
  mediterraneo: '#7c3aed', // violet-600
  fiordos: '#059669',     // emerald-600
  sudamerica: '#d97706',  // amber-600
}

const REGION_LABELS: Record<string, string> = {
  caribe: 'Caribe',
  mediterraneo: 'Mediterráneo',
  fiordos: 'Fiordos',
  sudamerica: 'Sudamérica',
}

function formatAxisDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-CL', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

export function TrendChart() {
  const { data: trend, isLoading } = useTrend()

  if (isLoading || !trend) {
    return (
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-56 w-full rounded-lg" />
      </div>
    )
  }

  // Sample every 7 days to reduce chart density
  const sampled = trend.filter((_, i) => i % 7 === 0 || i === trend.length - 1)

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="font-semibold text-base">📈 Tendencia de precios — últimos 90 días</h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          Precio promedio por región (USD · cabina interior de referencia)
        </p>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={sampled} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="date"
            tickFormatter={formatAxisDate}
            tick={{ fontSize: 11 }}
            stroke="hsl(var(--muted-foreground))"
          />
          <YAxis
            tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`}
            tick={{ fontSize: 11 }}
            stroke="hsl(var(--muted-foreground))"
            width={52}
          />
          <Tooltip
            labelFormatter={(label: string) =>
              new Date(label).toLocaleDateString('es-CL', {
                day: '2-digit',
                month: 'short',
                timeZone: 'UTC',
              })
            }
            formatter={(value: number, name: string) => [
              `$${value.toLocaleString('en-US')}`,
              REGION_LABELS[name] ?? name,
            ]}
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--card))',
              color: 'hsl(var(--card-foreground))',
              fontSize: '12px',
            }}
          />
          <Legend
            formatter={(value: string) => REGION_LABELS[value] ?? value}
            wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
          />
          {Object.keys(REGION_COLORS).map((region) => (
            <Line
              key={region}
              type="monotone"
              dataKey={region}
              name={region}
              stroke={REGION_COLORS[region]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
