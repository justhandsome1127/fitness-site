'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { format } from 'date-fns'

type Exercise = { name: string; sets: number; reps: string; weight: string }
type DietItem = { meal: string; name: string; calories: number | null; protein: number | null }
type Log = {
  id: number
  date: string
  exercises: Exercise[] | null
  diet: DietItem[] | null
  dietNote: string | null
  bodyNote: string | null
  photos: string[]
}
type WeightRow = {
  id: number
  dayNumber: number
  weight: number
  type: string
  note: string | null
  date: string | null
}
type Settings = {
  startDate: string
  goalWeight: number | null
  bodyFat: number | null
}

// Day N = 日期 − 起始日 + 1(UTC 相減)
function dayNumberFromDate(dateStr: string, startDateIso: string): number | null {
  if (!dateStr) return null
  const d = new Date(`${dateStr}T00:00:00.000Z`)
  const s = new Date(startDateIso)
  const diff = Math.round(
    (Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) -
      Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate())) /
      86_400_000
  )
  return diff + 1
}

// Day N → 日期字串(編輯舊資料、date 為空時用)
function dateFromDayNumber(dayNumber: number, startDateIso: string): string {
  const s = new Date(startDateIso)
  const d = new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate()))
  d.setUTCDate(d.getUTCDate() + dayNumber - 1)
  return d.toISOString().slice(0, 10)
}
type InBodyRow = {
  id: number
  date: string
  weight: number | null
  bodyFat: number
  muscle: number
  visceral: number
  note: string | null
}

const emptyExercise = (): Exercise => ({ name: '', sets: 3, reps: '10', weight: '' })

const MEAL_OPTIONS = ['早餐', '午餐', '晚餐', '點心'] as const

type DietFormItem = { meal: string; name: string; calories: string; protein: string }
const emptyDietItem = (meal: string = MEAL_OPTIONS[0]): DietFormItem => ({
  meal,
  name: '',
  calories: '',
  protein: '',
})

const DEFAULT_START = '2026-03-17T00:00:00.000Z'

export function AdminDashboard({
  initialLogs,
  initialWeights,
  initialInbody,
  initialSettings,
}: {
  initialLogs: Log[]
  initialWeights: WeightRow[]
  initialInbody: InBodyRow[]
  initialSettings: Settings | null
}) {
  const [logs, setLogs] = useState(initialLogs)
  const [weights, setWeights] = useState(initialWeights)
  const [inbodyList, setInbodyList] = useState(initialInbody)
  const [settings, setSettings] = useState<Settings>(
    initialSettings ?? { startDate: DEFAULT_START, goalWeight: null, bodyFat: null }
  )
  const [activeTab, setActiveTab] = useState<'log' | 'weight' | 'inbody' | 'settings'>('log')

  // Log form state
  const [editingLogDate, setEditingLogDate] = useState<string | null>(null)
  const [logDate, setLogDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [exercises, setExercises] = useState<Exercise[]>([emptyExercise()])
  const [dietItems, setDietItems] = useState<DietFormItem[]>([emptyDietItem()])
  const [bodyNote, setBodyNote] = useState('')
  const [photos, setPhotos] = useState<FileList | null>(null)
  const [existingPhotos, setExistingPhotos] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  // Weight form state
  const [editingWeightDay, setEditingWeightDay] = useState<number | null>(null)
  const [wDate, setWDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [wWeight, setWWeight] = useState('')
  const [wType, setWType] = useState('normal')
  const [wNote, setWNote] = useState('')
  const [wSaving, setWSaving] = useState(false)
  const wDayNumber = dayNumberFromDate(wDate, settings.startDate)

  // Settings form state
  const [sStartDate, setSStartDate] = useState(settings.startDate.slice(0, 10))
  const [sGoalWeight, setSGoalWeight] = useState(
    settings.goalWeight != null ? String(settings.goalWeight) : ''
  )
  const [sBodyFat, setSBodyFat] = useState(
    settings.bodyFat != null ? String(settings.bodyFat) : ''
  )
  const [sSaving, setSSaving] = useState(false)
  const latestInbodyFat = inbodyList[0]?.bodyFat ?? null

  // InBody form state
  const [editingInbodyId, setEditingInbodyId] = useState<number | null>(null)
  const [ibDate, setIbDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [ibWeight, setIbWeight] = useState('')
  const [ibBodyFat, setIbBodyFat] = useState('')
  const [ibMuscle, setIbMuscle] = useState('')
  const [ibVisceral, setIbVisceral] = useState('')
  const [ibNote, setIbNote] = useState('')
  const [ibSaving, setIbSaving] = useState(false)

  function addExercise() {
    setExercises((prev) => [...prev, emptyExercise()])
  }
  function removeExercise(i: number) {
    setExercises((prev) => prev.filter((_, idx) => idx !== i))
  }
  function updateExercise(i: number, field: keyof Exercise, value: string | number) {
    setExercises((prev) => prev.map((ex, idx) => (idx === i ? { ...ex, [field]: value } : ex)))
  }

  function addDietItem() {
    setDietItems((prev) => [...prev, emptyDietItem(prev[prev.length - 1]?.meal)])
  }
  function removeDietItem(i: number) {
    setDietItems((prev) => prev.filter((_, idx) => idx !== i))
  }
  function updateDietItem(i: number, field: keyof DietFormItem, value: string) {
    setDietItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)))
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
    const validDiet: DietItem[] = dietItems
      .filter((it) => it.name.trim())
      .map((it) => ({
        meal: it.meal,
        name: it.name.trim(),
        calories: it.calories ? parseFloat(it.calories) : null,
        protein: it.protein ? parseFloat(it.protein) : null,
      }))

    // 編輯同一天 = 取代(這樣改/刪才有效);其餘(新增、編輯改到別天)= 併入那天
    const mode = editingLogDate === logDate ? 'replace' : 'append'

    const res = await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: logDate,
        mode,
        exercises: validExercises.length ? validExercises : null,
        diet: validDiet.length ? validDiet : null,
        dietNote: null,
        bodyNote: bodyNote.trim() || null,
        photos: [...existingPhotos, ...uploadedPhotos],
      }),
    })

    setSaving(false)
    if (res.ok) {
      const newLog = await res.json()
      // 編輯時若改了日期(搬移/併入),刪掉來源那天
      if (editingLogDate && editingLogDate !== logDate) {
        await fetch(`/api/logs/${editingLogDate}`, { method: 'DELETE' })
      }
      const savedDate = (newLog as Log).date.slice(0, 10)
      const staleDates = new Set([logDate, editingLogDate].filter(Boolean))
      setLogs((prev) => [newLog, ...prev.filter((l) => !staleDates.has(l.date.slice(0, 10)))])
      // 存完回到乾淨的新增表單;要再改這天就從下方列表按「編輯」
      setEditingLogDate(null)
      setLogDate(format(new Date(), 'yyyy-MM-dd'))
      setExercises([emptyExercise()])
      setDietItems([emptyDietItem()])
      setBodyNote('')
      setPhotos(null)
      setExistingPhotos([])
      setMsg(
        mode === 'append'
          ? `✅ 已併入 ${savedDate} 的日誌(食物已照餐別排序)`
          : `✅ 已更新 ${savedDate} 的日誌`
      )
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
        date: wDate,
        weight: parseFloat(wWeight),
        type: wType,
        note: wNote.trim() || null,
      }),
    })
    setWSaving(false)
    if (res.ok) {
      const saved: WeightRow = await res.json()
      // 編輯時若改了 Day 編號,刪掉舊編號那筆
      if (editingWeightDay != null && editingWeightDay !== saved.dayNumber) {
        await fetch(`/api/weight/${editingWeightDay}`, { method: 'DELETE' })
      }
      const staleDays = new Set([saved.dayNumber, editingWeightDay].filter((d) => d != null))
      setWeights((prev) =>
        [saved, ...prev.filter((w) => !staleDays.has(w.dayNumber))].sort(
          (a, b) => b.dayNumber - a.dayNumber
        )
      )
      setEditingWeightDay(null)
      setWDate(format(new Date(), 'yyyy-MM-dd'))
      setWWeight('')
      setWNote('')
      setWType('normal')
      alert('體重記錄已更新！')
    }
  }

  function editWeight(w: WeightRow) {
    setActiveTab('weight')
    setEditingWeightDay(w.dayNumber)
    setWDate(
      w.date ? w.date.slice(0, 10) : dateFromDayNumber(w.dayNumber, settings.startDate)
    )
    setWWeight(String(w.weight))
    setWType(w.type)
    setWNote(w.note ?? '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function deleteWeight(dayNumber: number) {
    if (!confirm(`確定刪除 Day ${dayNumber} 的體重?`)) return
    await fetch(`/api/weight/${dayNumber}`, { method: 'DELETE' })
    setWeights((prev) => prev.filter((w) => w.dayNumber !== dayNumber))
  }

  async function handleInBodySubmit(e: React.FormEvent) {
    e.preventDefault()
    setIbSaving(true)
    const res = await fetch('/api/inbody', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: ibDate,
        weight: ibWeight ? parseFloat(ibWeight) : null,
        bodyFat: parseFloat(ibBodyFat),
        muscle: parseFloat(ibMuscle),
        visceral: parseFloat(ibVisceral),
        note: ibNote.trim() || null,
      }),
    })
    setIbSaving(false)
    if (res.ok) {
      const saved: InBodyRow = await res.json()
      // 編輯時若改了日期,upsert 會建出新 id,刪掉舊那筆
      if (editingInbodyId != null && editingInbodyId !== saved.id) {
        await fetch(`/api/inbody/${editingInbodyId}`, { method: 'DELETE' })
      }
      const staleIds = new Set([editingInbodyId].filter((id) => id != null))
      setInbodyList((prev) =>
        [
          saved,
          ...prev.filter(
            (e) => e.date.slice(0, 10) !== saved.date.slice(0, 10) && !staleIds.has(e.id)
          ),
        ].sort((a, b) => b.date.localeCompare(a.date))
      )
      setEditingInbodyId(null)
      setIbWeight('')
      setIbBodyFat('')
      setIbMuscle('')
      setIbVisceral('')
      setIbNote('')
      alert('InBody 記錄已更新！')
    } else {
      alert('儲存失敗，請再試')
    }
  }

  function editInbody(e: InBodyRow) {
    setActiveTab('inbody')
    setEditingInbodyId(e.id)
    setIbDate(e.date.slice(0, 10))
    setIbWeight(e.weight != null ? String(e.weight) : '')
    setIbBodyFat(String(e.bodyFat))
    setIbMuscle(String(e.muscle))
    setIbVisceral(String(e.visceral))
    setIbNote(e.note ?? '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function deleteInbody(id: number, date: string) {
    if (!confirm(`確定刪除 ${date.slice(0, 10)} 的 InBody?`)) return
    await fetch(`/api/inbody/${id}`, { method: 'DELETE' })
    setInbodyList((prev) => prev.filter((e) => e.id !== id))
  }

  // 把一筆日誌填進表單(編輯 / 選到已有資料的日期時共用)
  function fillLogForm(log: Log) {
    const day = log.date.slice(0, 10)
    setEditingLogDate(day)
    setLogDate(day)
    setExercises(log.exercises && log.exercises.length ? log.exercises : [emptyExercise()])
    setDietItems(
      log.diet && log.diet.length
        ? log.diet.map((it) => ({
            meal: it.meal ?? MEAL_OPTIONS[0],
            name: it.name,
            calories: it.calories != null ? String(it.calories) : '',
            protein: it.protein != null ? String(it.protein) : '',
          }))
        : [emptyDietItem()]
    )
    setBodyNote(log.bodyNote ?? '')
    setExistingPhotos(log.photos ?? [])
    setPhotos(null)
    setMsg('')
  }

  function editLog(log: Log) {
    setActiveTab('log')
    fillLogForm(log)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function deleteLog(id: number, date: string) {
    if (!confirm('確定刪除這筆日誌？')) return
    await fetch(`/api/logs/${date}`, { method: 'DELETE' })
    setLogs((prev) => prev.filter((l) => l.id !== id))
  }

  function cancelLogEdit() {
    setEditingLogDate(null)
    setLogDate(format(new Date(), 'yyyy-MM-dd'))
    setExercises([emptyExercise()])
    setDietItems([emptyDietItem()])
    setBodyNote('')
    setPhotos(null)
    setExistingPhotos([])
    setMsg('')
  }

  function cancelWeightEdit() {
    setEditingWeightDay(null)
    setWDate(format(new Date(), 'yyyy-MM-dd'))
    setWWeight('')
    setWNote('')
    setWType('normal')
  }

  async function handleSettingsSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSSaving(true)
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate: sStartDate,
        goalWeight: sGoalWeight,
        bodyFat: sBodyFat,
      }),
    })
    setSSaving(false)
    if (res.ok) {
      const saved = await res.json()
      setSettings({
        startDate: saved.startDate,
        goalWeight: saved.goalWeight,
        bodyFat: saved.bodyFat,
      })
      alert('設定已儲存！')
    } else {
      alert('儲存失敗，請再試')
    }
  }

  function cancelInbodyEdit() {
    setEditingInbodyId(null)
    setIbDate(format(new Date(), 'yyyy-MM-dd'))
    setIbWeight('')
    setIbBodyFat('')
    setIbMuscle('')
    setIbVisceral('')
    setIbNote('')
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-ink text-2xl">後台管理</h1>
        <button
          onClick={() => signOut()}
          className="text-ink-soft hover:text-ink text-sm transition-colors"
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
              ? 'bg-terracotta text-cream'
              : 'bg-paper border border-line text-ink-soft hover:text-ink'
          }`}
        >
          新增訓練日誌
        </button>
        <button
          onClick={() => setActiveTab('weight')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'weight'
              ? 'bg-terracotta text-cream'
              : 'bg-paper border border-line text-ink-soft hover:text-ink'
          }`}
        >
          新增體重記錄
        </button>
        <button
          onClick={() => setActiveTab('inbody')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'inbody'
              ? 'bg-terracotta text-cream'
              : 'bg-paper border border-line text-ink-soft hover:text-ink'
          }`}
        >
          新增 InBody
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'settings'
              ? 'bg-terracotta text-cream'
              : 'bg-paper border border-line text-ink-soft hover:text-ink'
          }`}
        >
          設定
        </button>
      </div>

      {activeTab === 'log' && (
        <form onSubmit={handleLogSubmit} className="space-y-6">
          {editingLogDate && (
            <div className="flex items-center justify-between bg-terracotta/10 border border-terracotta/30 rounded-lg px-3 py-2 text-sm">
              {editingLogDate !== logDate ? (
                <span className="text-mustard">
                  將把 {editingLogDate} 的內容併入 {logDate || '(未選日期)'}
                </span>
              ) : (
                <span className="text-terracotta">正在編輯 {editingLogDate} 的日誌</span>
              )}
              <button
                type="button"
                onClick={cancelLogEdit}
                className="text-ink-soft hover:text-ink text-xs transition-colors"
              >
                取消編輯
              </button>
            </div>
          )}
          {/* Date */}
          <div>
            <label className="block text-ink-soft text-sm mb-2">日期</label>
            <input
              type="date"
              value={logDate}
              onChange={(e) => setLogDate(e.target.value)}
              required
              className="bg-paper border border-line rounded-lg px-4 py-3 text-ink focus:outline-none focus:border-terracotta transition-colors"
            />
            {!editingLogDate && (
              <p className="text-ink-faint text-xs mt-1">
                直接送出會「併入」這天現有的內容,不會蓋掉;要修改或刪除既有品項請從下方列表按「編輯」。
              </p>
            )}
          </div>

          {/* Exercises */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-ink-soft text-sm">訓練動作</label>
              <button
                type="button"
                onClick={addExercise}
                className="text-terracotta hover:text-terracotta/80 text-sm transition-colors"
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
                    className="flex-1 bg-paper border border-line rounded-lg px-3 py-2 text-ink text-sm placeholder-ink-faint focus:outline-none focus:border-terracotta transition-colors"
                  />
                  <input
                    type="number"
                    placeholder="組"
                    value={ex.sets}
                    min={1}
                    onChange={(e) => updateExercise(i, 'sets', parseInt(e.target.value))}
                    className="w-14 bg-paper border border-line rounded-lg px-2 py-2 text-ink text-sm text-center focus:outline-none focus:border-terracotta transition-colors"
                  />
                  <input
                    placeholder="次數"
                    value={ex.reps}
                    onChange={(e) => updateExercise(i, 'reps', e.target.value)}
                    className="w-16 bg-paper border border-line rounded-lg px-2 py-2 text-ink text-sm text-center focus:outline-none focus:border-terracotta transition-colors"
                  />
                  <input
                    placeholder="重量"
                    value={ex.weight}
                    onChange={(e) => updateExercise(i, 'weight', e.target.value)}
                    className="w-20 bg-paper border border-line rounded-lg px-2 py-2 text-ink text-sm text-center focus:outline-none focus:border-terracotta transition-colors"
                  />
                  {exercises.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExercise(i)}
                      className="text-ink-faint hover:text-terracotta text-lg transition-colors"
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
            <div className="flex items-center justify-between mb-3">
              <label className="text-ink-soft text-sm">飲食記錄</label>
              <button
                type="button"
                onClick={addDietItem}
                className="text-terracotta hover:text-terracotta/80 text-sm transition-colors"
              >
                + 新增品項
              </button>
            </div>
            <div className="flex gap-2 px-1 mb-1 text-ink-faint text-xs">
              <span className="w-20">餐別</span>
              <span className="flex-1">品項</span>
              <span className="w-16 text-center">熱量</span>
              <span className="w-16 text-center">蛋白(g)</span>
              <span className="w-5" />
            </div>
            <div className="space-y-2">
              {dietItems.map((it, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select
                    value={it.meal}
                    onChange={(e) => updateDietItem(i, 'meal', e.target.value)}
                    className="w-20 bg-paper border border-line rounded-lg px-2 py-2 text-ink text-sm focus:outline-none focus:border-terracotta transition-colors"
                  >
                    {MEAL_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <input
                    placeholder="食物（如：雞胸肉 200g）"
                    value={it.name}
                    onChange={(e) => updateDietItem(i, 'name', e.target.value)}
                    className="flex-1 bg-paper border border-line rounded-lg px-3 py-2 text-ink text-sm placeholder-ink-faint focus:outline-none focus:border-terracotta transition-colors"
                  />
                  <input
                    type="number"
                    step="any"
                    placeholder="kcal"
                    value={it.calories}
                    onChange={(e) => updateDietItem(i, 'calories', e.target.value)}
                    className="w-16 bg-paper border border-line rounded-lg px-2 py-2 text-ink text-sm text-center focus:outline-none focus:border-terracotta transition-colors"
                  />
                  <input
                    type="number"
                    step="any"
                    placeholder="g"
                    value={it.protein}
                    onChange={(e) => updateDietItem(i, 'protein', e.target.value)}
                    className="w-16 bg-paper border border-line rounded-lg px-2 py-2 text-ink text-sm text-center focus:outline-none focus:border-terracotta transition-colors"
                  />
                  {dietItems.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeDietItem(i)}
                      className="w-5 text-ink-faint hover:text-terracotta text-lg transition-colors"
                    >
                      ×
                    </button>
                  ) : (
                    <span className="w-5" />
                  )}
                </div>
              ))}
            </div>
            <p className="text-ink-faint text-xs mt-2">熱量、蛋白可留空；日誌頁會自動顯示當天加總。</p>
          </div>

          {/* Body Note */}
          <div>
            <label className="block text-ink-soft text-sm mb-2">今日感受 / 備註</label>
            <textarea
              placeholder="體重、身體感受、睡眠、特別紀錄..."
              value={bodyNote}
              onChange={(e) => setBodyNote(e.target.value)}
              rows={2}
              className="w-full bg-paper border border-line rounded-lg px-4 py-3 text-ink placeholder-ink-faint focus:outline-none focus:border-terracotta transition-colors resize-none"
            />
          </div>

          {/* Photos */}
          <div>
            <label className="block text-ink-soft text-sm mb-2">體態照片</label>
            {existingPhotos.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {existingPhotos.map((url) => (
                  <div key={url} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-16 h-16 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => setExistingPhotos((prev) => prev.filter((p) => p !== url))}
                      className="absolute -top-1.5 -right-1.5 bg-paper border border-line text-ink-soft hover:text-terracotta rounded-full w-5 h-5 text-xs leading-none"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setPhotos(e.target.files)}
              className="block w-full text-sm text-ink-soft file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-cream file:border file:border-line file:text-ink-soft hover:file:bg-line file:transition-colors cursor-pointer"
            />
            <p className="text-ink-faint text-xs mt-1">
              {existingPhotos.length > 0
                ? '上方為現有照片(可移除);選新檔案會「加在」現有照片後面。'
                : '可一次選多張。'}
            </p>
          </div>

          {msg && (
            <p
              className={`text-sm ${
                msg.startsWith('✅')
                  ? 'text-olive'
                  : msg.startsWith('ℹ️')
                    ? 'text-ink-soft'
                    : 'text-terracotta'
              }`}
            >
              {msg}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-terracotta hover:bg-terracotta/90 disabled:opacity-50 text-cream font-medium py-3 rounded-lg transition-colors"
          >
            {saving ? '儲存中...' : '儲存日誌'}
          </button>
        </form>
      )}

      {activeTab === 'weight' && (
        <form onSubmit={handleWeightSubmit} className="space-y-4">
          {editingWeightDay != null && (
            <div className="flex items-center justify-between bg-terracotta/10 border border-terracotta/30 rounded-lg px-3 py-2 text-sm">
              <span className="text-terracotta">正在編輯 Day {editingWeightDay} 的體重</span>
              <button
                type="button"
                onClick={cancelWeightEdit}
                className="text-ink-soft hover:text-ink text-xs transition-colors"
              >
                取消編輯
              </button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-ink-soft text-sm mb-2">日期</label>
              <input
                type="date"
                value={wDate}
                onChange={(e) => setWDate(e.target.value)}
                required
                className="w-full bg-paper border border-line rounded-lg px-4 py-3 text-ink focus:outline-none focus:border-terracotta transition-colors"
              />
              <p className="text-ink-soft text-xs mt-1">
                {wDayNumber != null && wDayNumber >= 1
                  ? `= Day ${wDayNumber}（自動計算）`
                  : '日期需晚於起始日'}
              </p>
            </div>
            <div>
              <label className="block text-ink-soft text-sm mb-2">體重 (kg)</label>
              <input
                type="number"
                step="0.1"
                placeholder="如：81.5"
                value={wWeight}
                onChange={(e) => setWWeight(e.target.value)}
                required
                className="w-full bg-paper border border-line rounded-lg px-4 py-3 text-ink focus:outline-none focus:border-terracotta transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-ink-soft text-sm mb-2">類型</label>
            <select
              value={wType}
              onChange={(e) => setWType(e.target.value)}
              className="w-full bg-paper border border-line rounded-lg px-4 py-3 text-ink focus:outline-none focus:border-terracotta transition-colors"
            >
              <option value="normal">減脂期</option>
              <option value="break">放縱日</option>
              <option value="bulk">增肌期</option>
            </select>
          </div>
          <div>
            <label className="block text-ink-soft text-sm mb-2">備註（選填）</label>
            <input
              type="text"
              placeholder="如：Day 80"
              value={wNote}
              onChange={(e) => setWNote(e.target.value)}
              className="w-full bg-paper border border-line rounded-lg px-4 py-3 text-ink focus:outline-none focus:border-terracotta transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={wSaving}
            className="w-full bg-terracotta hover:bg-terracotta/90 disabled:opacity-50 text-cream font-medium py-3 rounded-lg transition-colors"
          >
            {wSaving ? '儲存中...' : '儲存體重'}
          </button>
        </form>
      )}

      {activeTab === 'inbody' && (
        <form onSubmit={handleInBodySubmit} className="space-y-4">
          {editingInbodyId != null && (
            <div className="flex items-center justify-between bg-terracotta/10 border border-terracotta/30 rounded-lg px-3 py-2 text-sm">
              <span className="text-terracotta">正在編輯 InBody 記錄</span>
              <button
                type="button"
                onClick={cancelInbodyEdit}
                className="text-ink-soft hover:text-ink text-xs transition-colors"
              >
                取消編輯
              </button>
            </div>
          )}
          <div>
            <label className="block text-ink-soft text-sm mb-2">量測日期</label>
            <input
              type="date"
              value={ibDate}
              onChange={(e) => setIbDate(e.target.value)}
              required
              className="bg-paper border border-line rounded-lg px-4 py-3 text-ink focus:outline-none focus:border-terracotta transition-colors"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-ink-soft text-sm mb-2">體脂率 (%)</label>
              <input
                type="number"
                step="0.1"
                placeholder="如：22.5"
                value={ibBodyFat}
                onChange={(e) => setIbBodyFat(e.target.value)}
                required
                className="w-full bg-paper border border-line rounded-lg px-4 py-3 text-ink focus:outline-none focus:border-terracotta transition-colors"
              />
            </div>
            <div>
              <label className="block text-ink-soft text-sm mb-2">骨骼肌重 (kg)</label>
              <input
                type="number"
                step="0.1"
                placeholder="如：35.2"
                value={ibMuscle}
                onChange={(e) => setIbMuscle(e.target.value)}
                required
                className="w-full bg-paper border border-line rounded-lg px-4 py-3 text-ink focus:outline-none focus:border-terracotta transition-colors"
              />
            </div>
            <div>
              <label className="block text-ink-soft text-sm mb-2">內臟脂肪等級</label>
              <input
                type="number"
                step="0.1"
                placeholder="如：9"
                value={ibVisceral}
                onChange={(e) => setIbVisceral(e.target.value)}
                required
                className="w-full bg-paper border border-line rounded-lg px-4 py-3 text-ink focus:outline-none focus:border-terracotta transition-colors"
              />
            </div>
            <div>
              <label className="block text-ink-soft text-sm mb-2">體重 (kg，選填)</label>
              <input
                type="number"
                step="0.1"
                placeholder="如：81.5"
                value={ibWeight}
                onChange={(e) => setIbWeight(e.target.value)}
                className="w-full bg-paper border border-line rounded-lg px-4 py-3 text-ink focus:outline-none focus:border-terracotta transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-ink-soft text-sm mb-2">備註（選填）</label>
            <input
              type="text"
              placeholder="如：早上空腹量測"
              value={ibNote}
              onChange={(e) => setIbNote(e.target.value)}
              className="w-full bg-paper border border-line rounded-lg px-4 py-3 text-ink focus:outline-none focus:border-terracotta transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={ibSaving}
            className="w-full bg-terracotta hover:bg-terracotta/90 disabled:opacity-50 text-cream font-medium py-3 rounded-lg transition-colors"
          >
            {ibSaving ? '儲存中...' : '儲存 InBody'}
          </button>
        </form>
      )}

      {activeTab === 'settings' && (
        <form onSubmit={handleSettingsSubmit} className="space-y-4">
          <div>
            <label className="block text-ink-soft text-sm mb-2">起始日（Day 1）</label>
            <input
              type="date"
              value={sStartDate}
              onChange={(e) => setSStartDate(e.target.value)}
              required
              className="bg-paper border border-line rounded-lg px-4 py-3 text-ink focus:outline-none focus:border-terracotta transition-colors"
            />
            <p className="text-ink-faint text-xs mt-1">
              所有體重的 Day 編號都從這天開始算,一般不用更動。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-ink-soft text-sm mb-2">目標體重 (kg)</label>
              <input
                type="number"
                step="0.1"
                placeholder="如：75"
                value={sGoalWeight}
                onChange={(e) => setSGoalWeight(e.target.value)}
                className="w-full bg-paper border border-line rounded-lg px-4 py-3 text-ink focus:outline-none focus:border-terracotta transition-colors"
              />
            </div>
            <div>
              <label className="block text-ink-soft text-sm mb-2">目前體脂 (%)</label>
              <input
                type="number"
                step="0.1"
                placeholder={
                  latestInbodyFat != null ? `留空帶最新 InBody ${latestInbodyFat}%` : '如：18.5'
                }
                value={sBodyFat}
                onChange={(e) => setSBodyFat(e.target.value)}
                className="w-full bg-paper border border-line rounded-lg px-4 py-3 text-ink focus:outline-none focus:border-terracotta transition-colors"
              />
              <p className="text-ink-faint text-xs mt-1">留空則前台自動顯示最新 InBody 體脂。</p>
            </div>
          </div>
          <button
            type="submit"
            disabled={sSaving}
            className="w-full bg-terracotta hover:bg-terracotta/90 disabled:opacity-50 text-cream font-medium py-3 rounded-lg transition-colors"
          >
            {sSaving ? '儲存中...' : '儲存設定'}
          </button>
        </form>
      )}

      {/* Log history */}
      {activeTab === 'log' && (
      <div className="mt-12">
        <h2 className="font-serif text-ink text-lg mb-4">已有日誌</h2>
        {logs.length === 0 ? (
          <p className="text-ink-faint text-sm">還沒有任何日誌</p>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="bg-paper border border-line rounded-lg px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-ink text-sm font-medium">{log.date.slice(0, 10)}</p>
                  <p className="text-ink-faint text-xs mt-0.5">
                    {log.exercises?.length ?? 0} 個動作 · {log.photos.length} 張照片
                  </p>
                </div>
                <div className="flex gap-3">
                  <a
                    href={`/log/${log.date.slice(0, 10)}`}
                    className="text-terracotta hover:text-terracotta/80 text-xs transition-colors"
                  >
                    查看
                  </a>
                  <button
                    onClick={() => editLog(log)}
                    className="text-ink-soft hover:text-ink text-xs transition-colors"
                  >
                    編輯
                  </button>
                  <button
                    onClick={() => deleteLog(log.id, log.date.slice(0, 10))}
                    className="text-ink-faint hover:text-terracotta text-xs transition-colors"
                  >
                    刪除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* Weight history */}
      {activeTab === 'weight' && (
      <div className="mt-12">
        <h2 className="font-serif text-ink text-lg mb-4">已有體重記錄</h2>
        {weights.length === 0 ? (
          <p className="text-ink-faint text-sm">還沒有任何體重記錄</p>
        ) : (
          <div className="space-y-2">
            {weights.map((w) => (
              <div
                key={w.id}
                className="bg-paper border border-line rounded-lg px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-ink text-sm font-medium">
                    Day {w.dayNumber} · {w.weight} kg
                    <span className="ml-2 text-xs text-ink-soft">
                      {w.type === 'break' ? '放縱日' : w.type === 'bulk' ? '增肌期' : '減脂期'}
                    </span>
                  </p>
                  {w.note && <p className="text-ink-faint text-xs mt-0.5">{w.note}</p>}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => editWeight(w)}
                    className="text-ink-soft hover:text-ink text-xs transition-colors"
                  >
                    編輯
                  </button>
                  <button
                    onClick={() => deleteWeight(w.dayNumber)}
                    className="text-ink-faint hover:text-terracotta text-xs transition-colors"
                  >
                    刪除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* InBody history */}
      {activeTab === 'inbody' && (
      <div className="mt-12">
        <h2 className="font-serif text-ink text-lg mb-4">已有 InBody 記錄</h2>
        {inbodyList.length === 0 ? (
          <p className="text-ink-faint text-sm">還沒有任何 InBody 記錄</p>
        ) : (
          <div className="space-y-2">
            {inbodyList.map((e) => (
              <div
                key={e.id}
                className="bg-paper border border-line rounded-lg px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-ink text-sm font-medium">{e.date.slice(0, 10)}</p>
                  <p className="text-ink-faint text-xs mt-0.5">
                    體脂 {e.bodyFat}% · 骨骼肌 {e.muscle}kg · 內臟脂肪 {e.visceral}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => editInbody(e)}
                    className="text-ink-soft hover:text-ink text-xs transition-colors"
                  >
                    編輯
                  </button>
                  <button
                    onClick={() => deleteInbody(e.id, e.date)}
                    className="text-ink-faint hover:text-terracotta text-xs transition-colors"
                  >
                    刪除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}
    </div>
  )
}
