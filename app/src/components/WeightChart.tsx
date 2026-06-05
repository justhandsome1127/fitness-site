'use client'

import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'

export type WeightPoint = {
  day: number
  weight: number
  note: string | null
  type: string
  dateStr: string
}

const DOT_COLORS: Record<string, string> = {
  normal: '#3b82f6',
  break: '#ef4444',
  bulk: '#22c55e',
}

function CustomDot(props: {
  cx?: number
  cy?: number
  payload?: WeightPoint
}) {
  const { cx, cy, payload } = props
  if (cx == null || cy == null || !payload) return null
  const color = DOT_COLORS[payload.type] ?? '#3b82f6'
  return (
    <circle
      cx={cx}
      cy={cy}
      r={3}
      fill={color}
      stroke="rgba(0,0,0,0.4)"
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
    d.type === 'break' ? '🍕 放縱日' : d.type === 'bulk' ? '💪 增肌期' : '💧 減脂期'
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm shadow-xl">
      <p className="text-white font-semibold">Day {d.day}</p>
      <p className="text-gray-400 text-xs mb-1">{d.dateStr}</p>
      <p className="text-white text-lg font-bold">{d.weight} kg</p>
      <p className="text-gray-400 text-xs mt-1">{typeLabel}</p>
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

  return (
    <div className="w-full overflow-x-auto rounded-xl bg-gray-900 p-4">
      <div style={{ width: chartWidth, height: 300 }}>
        <ComposedChart
          width={chartWidth}
          height={300}
          data={data}
          margin={{ top: 10, right: 24, left: 8, bottom: 0 }}
        >
          <defs>
            <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />

          <XAxis
            dataKey="day"
            tickFormatter={(v) => `D${v}`}
            tick={{ fill: '#6b7280', fontSize: 11 }}
            interval={Math.floor(data.length / 12)}
            axisLine={{ stroke: '#374151' }}
            tickLine={false}
          />

          <YAxis
            domain={[minW, maxW]}
            tickFormatter={(v) => `${v}`}
            tick={{ fill: '#6b7280', fontSize: 11 }}
            width={44}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip content={<CustomTooltip />} />

          <ReferenceLine y={85} stroke="#374151" strokeDasharray="4 4" label={{ value: '85', fill: '#4b5563', fontSize: 10 }} />
          <ReferenceLine y={83} stroke="#374151" strokeDasharray="4 4" label={{ value: '83', fill: '#4b5563', fontSize: 10 }} />
          <ReferenceLine y={81} stroke="#374151" strokeDasharray="4 4" label={{ value: '81', fill: '#4b5563', fontSize: 10 }} />

          <Area
            type="monotone"
            dataKey="weight"
            stroke="transparent"
            fill="url(#weightFill)"
          />

          <Line
            type="monotone"
            dataKey="weight"
            stroke="#475569"
            strokeWidth={2}
            dot={<CustomDot />}
            activeDot={{ r: 7, fill: '#fff', stroke: '#3b82f6', strokeWidth: 2 }}
          />
        </ComposedChart>
      </div>

      <div className="flex items-center gap-5 mt-3 px-2">
        <span className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className="inline-block w-3 h-3 rounded-full bg-blue-500" />
          減脂期
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className="inline-block w-3 h-3 rounded-full bg-red-500" />
          放縱日
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className="inline-block w-3 h-3 rounded-full bg-green-500" />
          增肌期
        </span>
        <span className="ml-auto text-xs text-gray-600">← 左右滑動查看完整紀錄</span>
      </div>
    </div>
  )
}
