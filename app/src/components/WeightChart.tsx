'use client'

import { useEffect, useState } from 'react'
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts'

export type WeightPoint = {
  day: number
  weight: number
  note: string | null
  type: string
  dateStr: string
}

const DOT_COLORS: Record<string, string> = {
  normal: '#5a8f6e', // 減脂期 — 鼠尾草綠(冷色,代表自律)
  break: '#d83a34', // 放縱日 — 正紅(暖色強調,警示)
  bulk: '#c8842a', // 增肌期 — 琥珀橙
}

function CustomDot(props: {
  cx?: number
  cy?: number
  payload?: WeightPoint
}) {
  const { cx, cy, payload } = props
  if (cx == null || cy == null || !payload) return null
  const color = DOT_COLORS[payload.type] ?? '#5a8f6e'

  // 放縱日:放大的菱形,即使點很小也能一眼區隔
  if (payload.type === 'break') {
    const s = 5.5
    return (
      <polygon
        points={`${cx},${cy - s} ${cx + s},${cy} ${cx},${cy + s} ${cx - s},${cy}`}
        fill={color}
        stroke="#faf7f0"
        strokeWidth={1.5}
      />
    )
  }

  return (
    <circle
      cx={cx}
      cy={cy}
      r={3.5}
      fill={color}
      stroke="#faf7f0"
      strokeWidth={1}
    />
  )
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: WeightPoint }>
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const typeLabel =
    d.type === 'break' ? '放縱日' : d.type === 'bulk' ? '增肌期' : '減脂期'
  const typeColor = DOT_COLORS[d.type] ?? '#5a8f6e'
  return (
    <div className="bg-paper border border-line rounded-lg p-3 text-sm shadow-md">
      <p className="text-ink-soft text-xs">Day {d.day} · {d.dateStr}</p>
      <p className="font-serif text-ink text-lg">{d.weight} kg</p>
      <p className="flex items-center gap-1.5 text-ink-soft text-xs mt-1">
        <span
          className="inline-block w-2.5 h-2.5"
          style={{
            background: typeColor,
            borderRadius: d.type === 'break' ? 0 : '9999px',
            transform: d.type === 'break' ? 'rotate(45deg)' : undefined,
          }}
        />
        {typeLabel}
      </p>
    </div>
  )
}

export function WeightChart({ data }: { data: WeightPoint[] }) {
  const PX_PER_POINT = 11
  const MIN_WIDTH = 600
  const chartWidth = Math.max(MIN_WIDTH, data.length * PX_PER_POINT)

  const weights = data.map((d) => d.weight)
  const minW = Math.min(...weights) - 0.5
  const maxW = Math.max(...weights) + 0.5

  // recharts generates SVG clipPath ids from a global counter that drifts
  // between the long-running dev server and a fresh client; render the chart
  // only after mount so server/client output match (avoids hydration error).
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <div className="w-full overflow-x-auto rounded-lg bg-paper border border-line p-4">
      <div style={{ width: chartWidth, height: 300 }}>
        {mounted && (
        <ComposedChart
          width={chartWidth}
          height={300}
          data={data}
          margin={{ top: 10, right: 24, left: 8, bottom: 0 }}
        >
          <defs>
            <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#bf6a4e" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#bf6a4e" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#e3dccd" />

          <XAxis
            dataKey="day"
            tickFormatter={(v) => `D${v}`}
            tick={{ fill: '#8a8178', fontSize: 11 }}
            interval={Math.floor(data.length / 12)}
            axisLine={{ stroke: '#d8cdb8' }}
            tickLine={false}
          />

          <YAxis
            domain={[minW, maxW]}
            tickFormatter={(v) => `${v}`}
            tick={{ fill: '#8a8178', fontSize: 11 }}
            width={44}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip content={<CustomTooltip />} />

          <ReferenceLine y={85} stroke="#d8cdb8" strokeDasharray="4 4" label={{ value: '85', fill: '#b3a99a', fontSize: 10 }} />
          <ReferenceLine y={83} stroke="#d8cdb8" strokeDasharray="4 4" label={{ value: '83', fill: '#b3a99a', fontSize: 10 }} />
          <ReferenceLine y={81} stroke="#d8cdb8" strokeDasharray="4 4" label={{ value: '81', fill: '#b3a99a', fontSize: 10 }} />

          <Area
            type="monotone"
            dataKey="weight"
            stroke="transparent"
            fill="url(#weightFill)"
          />

          <Line
            type="monotone"
            dataKey="weight"
            stroke="#c2b6a0"
            strokeWidth={2}
            dot={<CustomDot />}
            activeDot={{ r: 7, fill: '#faf7f0', stroke: '#bf6a4e', strokeWidth: 2 }}
          />
        </ComposedChart>
        )}
      </div>

      <div className="flex items-center gap-5 mt-3 px-2">
        <span className="flex items-center gap-1.5 text-xs text-ink-soft">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: DOT_COLORS.normal }} />
          減脂期
        </span>
        <span className="flex items-center gap-1.5 text-xs text-ink-soft">
          <span className="inline-block w-3 h-3" style={{ background: DOT_COLORS.break, transform: 'rotate(45deg)' }} />
          放縱日
        </span>
        <span className="flex items-center gap-1.5 text-xs text-ink-soft">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: DOT_COLORS.bulk }} />
          增肌期
        </span>
        <span className="ml-auto text-xs text-ink-faint">← 左右滑動查看完整紀錄</span>
      </div>
    </div>
  )
}
