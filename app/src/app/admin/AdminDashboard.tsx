'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { format } from 'date-fns'

type Exercise = { name: string; sets: number; reps: string; weight: string }
type Log = {
  id: number
  date: string
  exercises: Exercise[] | null
  dietNote: string | null
  bodyNote: string | null
  photos: string[]
}

const emptyExercise = (): Exercise => ({ name: '', sets: 3, reps: '10', weight: '' })

export function AdminDashboard({ initialLogs }: { initialLogs: Log[] }) {
  const [logs, setLogs] = useState(initialLogs)
  const [activeTab, setActiveTab] = useState<'log' | 'weight'>('log')

  // Log form state
  const [logDate, setLogDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [exercises, setExercises] = useState<Exercise[]>([emptyExercise()])
  const [dietNote, setDietNote] = useState('')
  const [bodyNote, setBodyNote] = useState('')
  const [photos, setPhotos] = useState<FileList | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  // Weight form state
  const [wDay, setWDay] = useState('')
  const [wWeight, setWWeight] = useState('')
  const [wType, setWType] = useState('normal')
  const [wNote, setWNote] = useState('')
  const [wSaving, setWSaving] = useState(false)

  function addExercise() {
    setExercises((prev) => [...prev, emptyExercise()])
  }
  function removeExercise(i: number) {
    setExercises((prev) => prev.filter((_, idx) => idx !== i))
  }
  function updateExercise(i: number, field: keyof Exercise, value: string | number) {
    setExercises((prev) => prev.map((ex, idx) => (idx === i ? { ...ex, [field]: value } : ex)))
  }

  async function handleLogSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMsg('')

    let uploadedPhotos: string[] = []
    if (photos && photos.length > 0) {
      for (const file of Array.from(photos)) {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        const json = await res.json()
        if (json.url) uploadedPhotos.push(json.url)
      }
    }

    const validExercises = exercises.filter((ex) => ex.name.trim())

    const res = await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: logDate,
        exercises: validExercises.length ? validExercises : null,
        dietNote: dietNote.trim() || null,
        bodyNote: bodyNote.trim() || null,
        photos: uploadedPhotos,
      }),
    })

    setSaving(false)
    if (res.ok) {
      const newLog = await res.json()
      setLogs((prev) => [newLog, ...prev.filter((l) => l.date.slice(0, 10) !== logDate)])
      setExercises([emptyExercise()])
      setDietNote('')
      setBodyNote('')
      setPhotos(null)
      setMsg('✅ 日誌儲存成功！')
    } else {
      setMsg('❌ 儲存失敗，請再試')
    }
  }

  async function handleWeightSubmit(e: React.FormEvent) {
    e.preventDefault()
    setWSaving(true)
    const res = await fetch('/api/weight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dayNumber: parseInt(wDay),
        weight: parseFloat(wWeight),
        type: wType,
        note: wNote.trim() || null,
      }),
    })
    setWSaving(false)
    if (res.ok) {
      setWDay('')
      setWWeight('')
      setWNote('')
      alert('體重記錄已更新！')
    }
  }

  async function deleteLog(id: number, date: string) {
    if (!confirm('確定刪除這筆日誌？')) return
    await fetch(`/api/logs/${date}`, { method: 'DELETE' })
    setLogs((prev) => prev.filter((l) => l.id !== id))
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-white text-2xl font-bold">後台管理</h1>
        <button
          onClick={() => signOut()}
          className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
        >
          登出
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => setActiveTab('log')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'log'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-900 text-gray-400 hover:text-white'
          }`}
        >
          新增訓練日誌
        </button>
        <button
          onClick={() => setActiveTab('weight')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'weight'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-900 text-gray-400 hover:text-white'
          }`}
        >
          新增體重記錄
        </button>
      </div>

      {activeTab === 'log' && (
        <form onSubmit={handleLogSubmit} className="space-y-6">
          {/* Date */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">日期</label>
            <input
              type="date"
              value={logDate}
              onChange={(e) => setLogDate(e.target.value)}
              required
              className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Exercises */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-gray-400 text-sm">訓練動作</label>
              <button
                type="button"
                onClick={addExercise}
                className="text-blue-500 hover:text-blue-400 text-sm transition-colors"
              >
                + 新增動作
              </button>
            </div>
            <div className="space-y-2">
              {exercises.map((ex, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    placeholder="動作名稱（如：臥推）"
                    value={ex.name}
                    onChange={(e) => updateExercise(i, 'name', e.target.value)}
                    className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <input
                    type="number"
                    placeholder="組"
                    value={ex.sets}
                    min={1}
                    onChange={(e) => updateExercise(i, 'sets', parseInt(e.target.value))}
                    className="w-14 bg-gray-900 border border-gray-700 rounded-lg px-2 py-2 text-white text-sm text-center focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <input
                    placeholder="次數"
                    value={ex.reps}
                    onChange={(e) => updateExercise(i, 'reps', e.target.value)}
                    className="w-16 bg-gray-900 border border-gray-700 rounded-lg px-2 py-2 text-white text-sm text-center focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <input
                    placeholder="重量"
                    value={ex.weight}
                    onChange={(e) => updateExercise(i, 'weight', e.target.value)}
                    className="w-20 bg-gray-900 border border-gray-700 rounded-lg px-2 py-2 text-white text-sm text-center focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  {exercises.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExercise(i)}
                      className="text-gray-600 hover:text-red-400 text-lg transition-colors"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Diet */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">飲食記錄</label>
            <textarea
              placeholder="早餐：燕麥 + 蛋白粉&#10;午餐：雞胸肉 + 糙米&#10;晚餐：..."
              value={dietNote}
              onChange={(e) => setDietNote(e.target.value)}
              rows={4}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
          </div>

          {/* Body Note */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">今日感受 / 備註</label>
            <textarea
              placeholder="體重、身體感受、睡眠、特別紀錄..."
              value={bodyNote}
              onChange={(e) => setBodyNote(e.target.value)}
              rows={2}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
          </div>

          {/* Photos */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">體態照片</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setPhotos(e.target.files)}
              className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-800 file:text-gray-300 hover:file:bg-gray-700 file:transition-colors cursor-pointer"
            />
          </div>

          {msg && (
            <p className={`text-sm ${msg.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>
              {msg}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors"
          >
            {saving ? '儲存中...' : '儲存日誌'}
          </button>
        </form>
      )}

      {activeTab === 'weight' && (
        <form onSubmit={handleWeightSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Day 編號</label>
              <input
                type="number"
                placeholder="如：80"
                value={wDay}
                onChange={(e) => setWDay(e.target.value)}
                required
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">體重 (kg)</label>
              <input
                type="number"
                step="0.1"
                placeholder="如：81.5"
                value={wWeight}
                onChange={(e) => setWWeight(e.target.value)}
                required
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-2">類型</label>
            <select
              value={wType}
              onChange={(e) => setWType(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="normal">💙 一般日</option>
              <option value="break">❤️ 放縱日</option>
              <option value="bulk">💚 增肌期</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-2">備註（選填）</label>
            <input
              type="text"
              placeholder="如：Day 80"
              value={wNote}
              onChange={(e) => setWNote(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={wSaving}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors"
          >
            {wSaving ? '儲存中...' : '儲存體重'}
          </button>
        </form>
      )}

      {/* Log history */}
      <div className="mt-12">
        <h2 className="text-gray-400 text-sm uppercase tracking-widest mb-4">已有日誌</h2>
        {logs.length === 0 ? (
          <p className="text-gray-600 text-sm">還沒有任何日誌</p>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-white text-sm font-medium">{log.date.slice(0, 10)}</p>
                  <p className="text-gray-600 text-xs mt-0.5">
                    {log.exercises?.length ?? 0} 個動作 · {log.photos.length} 張照片
                  </p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`/log/${log.date.slice(0, 10)}`}
                    className="text-blue-500 hover:text-blue-400 text-xs transition-colors"
                  >
                    查看
                  </a>
                  <button
                    onClick={() => deleteLog(log.id, log.date.slice(0, 10))}
                    className="text-gray-600 hover:text-red-400 text-xs transition-colors"
                  >
                    刪除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
