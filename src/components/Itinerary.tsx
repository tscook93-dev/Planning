import { useState } from 'react'
import type { DayPlan, Activity } from '../types'

interface Props {
  itinerary: DayPlan[]
  departureDate: string
  returnDate: string
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

export default function Itinerary({ itinerary, departureDate, returnDate, onChange }: Props) {
  const [expandedDay, setExpandedDay] = useState<string | null>(null)
  const [editingActivity, setEditingActivity] = useState<{ dayDate: string; activity: Activity } | null>(null)

  const dates = getDatesInRange(departureDate, returnDate)

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
    const newActivity: Activity = {
      id: genId(),
      time: '',
      title: '',
      location: '',
      notes: '',
      done: false,
    }
    setEditingActivity({ dayDate: date, activity: newActivity })
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
      activities: day.activities.map(a =>
        a.id === id ? { ...a, done: !a.done } : a
      ),
    })
  }

  if (dates.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-5xl mb-4">🗓️</p>
        <p className="text-lg font-medium">Set your travel dates in Trip Overview to build your itinerary</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {dates.map((date, idx) => {
        const day = getDayPlan(date)
        const label = new Date(date).toLocaleDateString('en-AU', {
          weekday: 'long', day: 'numeric', month: 'long',
        })
        const isOpen = expandedDay === date

        return (
          <div key={date} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <button
              onClick={() => setExpandedDay(isOpen ? null : date)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="flex-shrink-0 w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <div>
                  <p className="font-semibold text-gray-900">{label}</p>
                  <p className="text-sm text-gray-400">
                    {day.activities.length === 0
                      ? 'No activities yet'
                      : `${day.activities.length} activit${day.activities.length === 1 ? 'y' : 'ies'} · ${day.activities.filter(a => a.done).length} done`}
                  </p>
                </div>
              </div>
              <span className="text-gray-400 text-lg">{isOpen ? '▲' : '▼'}</span>
            </button>

            {isOpen && (
              <div className="border-t border-gray-100 px-5 py-4 space-y-3">
                {day.activities.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-2">No activities planned for this day yet</p>
                )}
                {day.activities
                  .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
                  .map(act => (
                    <div
                      key={act.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border ${act.done ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}
                    >
                      <input
                        type="checkbox"
                        checked={act.done}
                        onChange={() => toggleDone(date, act.id)}
                        className="mt-1 w-4 h-4 accent-indigo-600 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {act.time && (
                            <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                              {act.time}
                            </span>
                          )}
                          <span className={`font-medium text-sm ${act.done ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                            {act.title || 'Untitled activity'}
                          </span>
                        </div>
                        {act.location && (
                          <p className="text-xs text-gray-400 mt-0.5">📍 {act.location}</p>
                        )}
                        {act.notes && (
                          <p className="text-xs text-gray-500 mt-1">{act.notes}</p>
                        )}
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

      {editingActivity && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">
              {itinerary.find(d => d.date === editingActivity.dayDate)?.activities.find(a => a.id === editingActivity.activity.id)
                ? 'Edit Activity'
                : 'Add Activity'}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Activity Name *</label>
                <input
                  type="text"
                  value={editingActivity.activity.title}
                  onChange={e => setEditingActivity({ ...editingActivity, activity: { ...editingActivity.activity, title: e.target.value } })}
                  placeholder="e.g. Visit Senso-ji Temple"
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
                  placeholder="e.g. Asakusa, Tokyo"
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
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setEditingActivity(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveActivity}
                disabled={!editingActivity.activity.title.trim()}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
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
