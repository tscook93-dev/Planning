import { useState } from 'react'
import type { DayPlan, Activity, Leg } from '../types'
import { LEG_TYPE_CONFIG, LEG_COLORS } from '../types'

interface Props {
  itinerary: DayPlan[]
  legs: Leg[]
  onChange: (itinerary: DayPlan[]) => void
}

function genId() {
  return Math.random().toString(36).slice(2)
}

function getDatesInRange(start: string, end: string): string[] {
  if (!start || !end) return []
  const dates: string[] = []
  const cur = new Date(start)
  const last = new Date(end)
  while (cur <= last) {
    dates.push(cur.toISOString().split('T')[0])
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

function getLegsForDate(date: string, legs: Leg[]): { leg: Leg; idx: number }[] {
  return legs
    .map((leg, idx) => ({ leg, idx }))
    .filter(({ leg }) => {
      const d = leg.departureDate
      const a = leg.arrivalDate
      return (d && a && d <= date && date <= a) || d === date || a === date
    })
}

export default function Itinerary({ itinerary, legs, onChange }: Props) {
  const [expandedDay, setExpandedDay] = useState<string | null>(null)
  const [editingActivity, setEditingActivity] = useState<{ dayDate: string; activity: Activity } | null>(null)

  const tripStart = legs.map(l => l.departureDate).filter(Boolean).sort()[0] ?? ''
  const tripEnd = legs.map(l => l.arrivalDate).filter(Boolean).sort().at(-1) ?? ''
  const dates = getDatesInRange(tripStart, tripEnd)

  const getDayPlan = (date: string): DayPlan =>
    itinerary.find(d => d.date === date) ?? { date, activities: [] }

  const updateDay = (updated: DayPlan) => {
    const existing = itinerary.find(d => d.date === updated.date)
    if (existing) {
      onChange(itinerary.map(d => (d.date === updated.date ? updated : d)))
    } else {
      onChange([...itinerary, updated])
    }
  }

  const addActivity = (date: string) => {
    setEditingActivity({
      dayDate: date,
      activity: { id: genId(), time: '', title: '', location: '', notes: '', done: false },
    })
  }

  const saveActivity = () => {
    if (!editingActivity) return
    const { dayDate, activity } = editingActivity
    const day = getDayPlan(dayDate)
    const existing = day.activities.find(a => a.id === activity.id)
    const activities = existing
      ? day.activities.map(a => (a.id === activity.id ? activity : a))
      : [...day.activities, activity]
    updateDay({ ...day, activities })
    setEditingActivity(null)
  }

  const removeActivity = (date: string, id: string) => {
    const day = getDayPlan(date)
    updateDay({ ...day, activities: day.activities.filter(a => a.id !== id) })
  }

  const toggleDone = (date: string, id: string) => {
    const day = getDayPlan(date)
    updateDay({
      ...day,
      activities: day.activities.map(a => (a.id === id ? { ...a, done: !a.done } : a)),
    })
  }

  if (legs.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-5xl mb-4">🗓️</p>
        <p className="text-lg font-medium">Add trip legs in Overview to build your itinerary</p>
      </div>
    )
  }

  if (dates.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-5xl mb-4">📅</p>
        <p className="text-lg font-medium">Add departure and arrival dates to your legs to see the itinerary</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Leg legend */}
      <div className="flex flex-wrap gap-2 pb-1">
        {legs.map((leg, idx) => {
          const color = LEG_COLORS[idx % LEG_COLORS.length]
          const cfg = LEG_TYPE_CONFIG[leg.type]
          return (
            <span key={leg.id} className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${color.badge}`}>
              {cfg.icon} {leg.from} → {leg.to}
            </span>
          )
        })}
      </div>

      {dates.map((date, idx) => {
        const day = getDayPlan(date)
        const activeLegs = getLegsForDate(date, legs)
        const primaryLeg = activeLegs[0]
        const color = primaryLeg ? LEG_COLORS[primaryLeg.idx % LEG_COLORS.length] : null
        const label = new Date(date + 'T12:00:00').toLocaleDateString('en-AU', {
          weekday: 'long', day: 'numeric', month: 'long',
        })
        const isOpen = expandedDay === date

        // Detect transition days (leg starts or ends)
        const transitions = legs
          .map((leg, i) => ({ leg, i }))
          .filter(({ leg }) => leg.departureDate === date || leg.arrivalDate === date)

        return (
          <div
            key={date}
            className={`rounded-xl border border-gray-200 shadow-sm overflow-hidden ${color ? color.bg : 'bg-white'}`}
          >
            {/* Leg color bar */}
            {color && <div className={`h-1 ${color.bar}`} />}

            <button
              onClick={() => setExpandedDay(isOpen ? null : date)}
              className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-white/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-white/80 text-gray-700 text-xs font-bold flex items-center justify-center shadow-sm">
                  {idx + 1}
                </span>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{label}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {transitions.map(({ leg, i }) => (
                      <span key={leg.id} className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEG_COLORS[i % LEG_COLORS.length].badge}`}>
                        {LEG_TYPE_CONFIG[leg.type].icon}{' '}
                        {leg.departureDate === date ? `Depart ${leg.from}` : `Arrive ${leg.to}`}
                      </span>
                    ))}
                    {transitions.length === 0 && (
                      <p className="text-xs text-gray-400">
                        {day.activities.length === 0
                          ? 'No activities yet'
                          : `${day.activities.length} activit${day.activities.length === 1 ? 'y' : 'ies'} · ${day.activities.filter(a => a.done).length} done`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <span className="text-gray-400 text-sm">{isOpen ? '▲' : '▼'}</span>
            </button>

            {isOpen && (
              <div className="border-t border-white/60 bg-white/70 px-4 py-4 space-y-3">
                {day.activities.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-1">No activities planned yet</p>
                )}
                {day.activities
                  .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
                  .map(act => (
                    <div
                      key={act.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border ${act.done ? 'bg-green-50 border-green-100' : 'bg-white border-gray-100'}`}
                    >
                      <input
                        type="checkbox"
                        checked={act.done}
                        onChange={() => toggleDone(date, act.id)}
                        className="mt-0.5 w-4 h-4 accent-indigo-600 cursor-pointer flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {act.time && (
                            <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                              {act.time}
                            </span>
                          )}
                          <span className={`font-medium text-sm ${act.done ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                            {act.title || 'Untitled activity'}
                          </span>
                        </div>
                        {act.location && <p className="text-xs text-gray-400 mt-0.5">📍 {act.location}</p>}
                        {act.notes && <p className="text-xs text-gray-500 mt-1">{act.notes}</p>}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => setEditingActivity({ dayDate: date, activity: { ...act } })}
                          className="text-xs text-indigo-500 hover:text-indigo-700 px-2 py-1 rounded hover:bg-indigo-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => removeActivity(date, act.id)}
                          className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                <button
                  onClick={() => addActivity(date)}
                  className="w-full py-2.5 border-2 border-dashed border-indigo-200 text-indigo-500 rounded-lg text-sm font-medium hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
                >
                  + Add Activity
                </button>
              </div>
            )}
          </div>
        )
      })}

      {/* Activity modal */}
      {editingActivity && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-900">
              {itinerary.find(d => d.date === editingActivity.dayDate)?.activities.find(a => a.id === editingActivity.activity.id)
                ? 'Edit Activity' : 'Add Activity'}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Activity Name *</label>
                <input
                  type="text"
                  value={editingActivity.activity.title}
                  onChange={e => setEditingActivity({ ...editingActivity, activity: { ...editingActivity.activity, title: e.target.value } })}
                  placeholder="e.g. Sagrada Família"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Time</label>
                <input
                  type="time"
                  value={editingActivity.activity.time}
                  onChange={e => setEditingActivity({ ...editingActivity, activity: { ...editingActivity.activity, time: e.target.value } })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Location</label>
                <input
                  type="text"
                  value={editingActivity.activity.location}
                  onChange={e => setEditingActivity({ ...editingActivity, activity: { ...editingActivity.activity, location: e.target.value } })}
                  placeholder="e.g. Barcelona"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                <textarea
                  value={editingActivity.activity.notes}
                  onChange={e => setEditingActivity({ ...editingActivity, activity: { ...editingActivity.activity, notes: e.target.value } })}
                  placeholder="Booking refs, tips, costs..."
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setEditingActivity(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveActivity}
                disabled={!editingActivity.activity.title.trim()}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-40"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
