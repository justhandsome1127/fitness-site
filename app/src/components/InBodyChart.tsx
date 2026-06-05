'use client'

import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export type InBodyPoint = {
  date: string // 顯示用 M/d
  bodyFat: number // 體脂率 %
  muscle: number // 骨骼肌 kg
  visceral: number // 內臟脂肪等級
  note: string | null
}

const SERIES = [
  { key: 'bodyFat', label: '體脂率', color: '#3b82f6', unit: '%', axis: 'left' },
  { key: 'muscle', label: '骨骼肌', color: '#22c55e', unit: 'kg', axis: 'right' },
  { key: 'visceral', label: '內臟脂肪', color: '#f59e0b', unit: '級', axis: 'left' },
] as const

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: InBodyPoint }>
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm shadow-xl">
      <p className="text-gray-400 text-xs mb-2">{d.date}</p>
      {SERIES.map((s) => (
        <p key={s.key} className="flex items-center gap-1.5 text-white">
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: s.color }} />
          {s.label}
          <span className="ml-auto pl-3 font-semibold">
            {d[s.key]}
            <span className="text-gray-500 text-xs ml-0.5">{s.unit}</span>
          </span>
        </p>
      ))}
      {d.note && <p className="text-gray-500 text-xs mt-2 max-w-[180px]">{d.note}</p>}
    </div>
  )
}

export function InBodyChart({ data }: { data: InBodyPoint[] }) {
  return (
    <div className="w-full rounded-xl bg-gray-900 p-4">
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />

            <XAxis
              dataKey="date"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={{ stroke: '#374151' }}
              tickLine={false}
            />

            {/* 左軸：體脂率 % + 內臟脂肪等級 */}
            <YAxis
              yAxisId="left"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              width={36}
              axisLine={false}
              tickLine={false}
            />
            {/* 右軸：骨骼肌 kg */}
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              width={36}
              axisLine={false}
              tickLine={false}
              domain={['dataMin - 1', 'dataMax + 1']}
            />

            <Tooltip content={<CustomTooltip />} />

            {SERIES.map((s) => (
              <Line
                key={s.key}
                yAxisId={s.axis}
                type="monotone"
                dataKey={s.key}
                stroke={s.color}
                strokeWidth={2}
                dot={{ r: 3, fill: s.color, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#fff', stroke: s.color, strokeWidth: 2 }}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap items-center gap-5 mt-3 px-2">
        {SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: s.color }} />
            {s.label}（{s.axis === 'right' ? '右軸 ' : ''}
            {s.unit}）
          </span>
        ))}
      </div>
    </div>
  )
}
