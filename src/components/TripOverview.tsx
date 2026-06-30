import { useState } from 'react'
import type { TripInfo, Leg, LegType } from '../types'
import { LEG_TYPE_CONFIG, LEG_COLORS } from '../types'

interface Props {
  trip: TripInfo
  onChange: (trip: TripInfo) => void
}

function genId() {
  return Math.random().toString(36).slice(2)
}

const EMPTY_LEG: Omit<Leg, 'id'> = {
  type: 'flight',
  from: '',
  to: '',
  departureDate: '',
  arrivalDate: '',
  bookingRef: '',
  notes: '',
}

function fmt(date: string) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function TripOverview({ trip, onChange }: Props) {
  const [editingLeg, setEditingLeg] = useState<Leg | null>(null)
  const [isNewLeg, setIsNewLeg] = useState(false)

  const updateTrip = (patch: Partial<TripInfo>) => onChange({ ...trip, ...patch })

  const openNewLeg = () => {
    setIsNewLeg(true)
    setEditingLeg({ id: genId(), ...EMPTY_LEG })
  }

  const openEditLeg = (leg: Leg) => {
    setIsNewLeg(false)
    setEditingLeg({ ...leg })
  }

  const saveLeg = () => {
    if (!editingLeg) return
    const legs = isNewLeg
      ? [...trip.legs, editingLeg]
      : trip.legs.map(l => (l.id === editingLeg.id ? editingLeg : l))
    updateTrip({ legs })
    setEditingLeg(null)
  }

  const removeLeg = (id: string) => updateTrip({ legs: trip.legs.filter(l => l.id !== id) })

  const moveLeg = (id: string, dir: -1 | 1) => {
    const idx = trip.legs.findIndex(l => l.id === id)
    if (idx < 0) return
    const next = idx + dir
    if (next < 0 || next >= trip.legs.length) return
    const legs = [...trip.legs]
    ;[legs[idx], legs[next]] = [legs[next], legs[idx]]
    updateTrip({ legs })
  }

  const tripStart = trip.legs.length > 0
    ? trip.legs.map(l => l.departureDate).filter(Boolean).sort()[0]
    : ''
  const tripEnd = trip.legs.length > 0
    ? trip.legs.map(l => l.arrivalDate).filter(Boolean).sort().at(-1)
    : ''
  const nights = tripStart && tripEnd
    ? Math.max(0, Math.round((new Date(tripEnd).getTime() - new Date(tripStart).getTime()) / 86400000))
    : 0

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-1">{trip.name || 'Your Holiday'}</h2>
        {trip.legs.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2 text-sm text-indigo-100">
            {trip.legs.map((leg, i) => (
              <span key={leg.id} className="flex items-center gap-1">
                {i > 0 && <span className="text-indigo-300">→</span>}
                <span>{LEG_TYPE_CONFIG[leg.type].icon}</span>
                <span>{leg.from}{leg.to ? ` → ${leg.to}` : ''}</span>
              </span>
            ))}
          </div>
        )}
        {nights > 0 && (
          <p className="text-indigo-200 text-sm mt-2">
            {fmt(tripStart)} – {fmt(tripEnd ?? '')} · {nights} night{nights !== 1 ? 's' : ''} · {trip.travelers} traveller{trip.travelers !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Basic info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm sm:col-span-2">
          <label className="block text-xs font-medium text-gray-400 mb-1">Trip Name</label>
          <input
            type="text"
            value={trip.name}
            onChange={e => updateTrip({ name: e.target.value })}
            placeholder="e.g. European Adventure 2026"
            className="w-full text-lg font-semibold text-gray-900 outline-none bg-transparent placeholder-gray-300"
          />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <label className="block text-xs font-medium text-gray-400 mb-1">Travellers</label>
          <input
            type="number"
            min={1}
            max={20}
            value={trip.travelers}
            onChange={e => updateTrip({ travelers: parseInt(e.target.value) || 1 })}
            className="w-full text-lg font-semibold text-gray-900 outline-none bg-transparent"
          />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <label className="block text-xs font-medium text-gray-400 mb-1">Notes</label>
          <textarea
            value={trip.notes}
            onChange={e => updateTrip({ notes: e.target.value })}
            placeholder="Visa requirements, notes..."
            rows={2}
            className="w-full text-sm text-gray-700 outline-none bg-transparent resize-none placeholder-gray-300"
          />
        </div>
      </div>

      {/* Legs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Trip Legs</h3>
          <button
            onClick={openNewLeg}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-200 px-3 py-1.5 rounded-xl hover:bg-indigo-50"
          >
            + Add Leg
          </button>
        </div>

        {trip.legs.length === 0 && (
          <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
            <p className="text-3xl mb-2">✈️ 🚢</p>
            <p className="text-sm text-gray-400">Add your flights, cruises and other travel legs</p>
            <button onClick={openNewLeg} className="mt-3 text-sm font-medium text-indigo-600 hover:underline">
              Add your first leg
            </button>
          </div>
        )}

        <div className="space-y-2">
          {trip.legs.map((leg, idx) => {
            const cfg = LEG_TYPE_CONFIG[leg.type]
            const color = LEG_COLORS[idx % LEG_COLORS.length]
            return (
              <div key={leg.id} className={`rounded-xl border border-gray-200 overflow-hidden ${color.bg}`}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${color.badge}`}>
                    {cfg.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {leg.from || '?'} → {leg.to || '?'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {cfg.label}{leg.departureDate ? ` · ${fmt(leg.departureDate)}` : ''}{leg.arrivalDate && leg.arrivalDate !== leg.departureDate ? ` – ${fmt(leg.arrivalDate)}` : ''}
                      {leg.bookingRef ? ` · Ref: ${leg.bookingRef}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => moveLeg(leg.id, -1)} disabled={idx === 0} className="text-gray-400 hover:text-gray-600 disabled:opacity-20 text-xs px-1">↑</button>
                    <button onClick={() => moveLeg(leg.id, 1)} disabled={idx === trip.legs.length - 1} className="text-gray-400 hover:text-gray-600 disabled:opacity-20 text-xs px-1">↓</button>
                    <button onClick={() => openEditLeg(leg)} className="text-indigo-500 hover:text-indigo-700 text-xs px-2 py-1 rounded hover:bg-indigo-50">Edit</button>
                    <button onClick={() => removeLeg(leg.id)} className="text-gray-300 hover:text-red-400 text-sm px-1">✕</button>
                  </div>
                </div>
                {leg.notes && (
                  <p className="text-xs text-gray-500 px-4 pb-3">{leg.notes}</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Leg edit modal */}
      {editingLeg && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-gray-900">{isNewLeg ? 'Add Leg' : 'Edit Leg'}</h3>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Travel Type</label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(LEG_TYPE_CONFIG) as LegType[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setEditingLeg({ ...editingLeg, type: t })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      editingLeg.type === t
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    {LEG_TYPE_CONFIG[t].icon} {LEG_TYPE_CONFIG[t].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
                <input
                  type="text"
                  value={editingLeg.from}
                  onChange={e => setEditingLeg({ ...editingLeg, from: e.target.value })}
                  placeholder="e.g. Sydney"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
                <input
                  type="text"
                  value={editingLeg.to}
                  onChange={e => setEditingLeg({ ...editingLeg, to: e.target.value })}
                  placeholder="e.g. Barcelona"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Departure Date</label>
                <input
                  type="date"
                  value={editingLeg.departureDate}
                  onChange={e => setEditingLeg({ ...editingLeg, departureDate: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Arrival Date</label>
                <input
                  type="date"
                  value={editingLeg.arrivalDate}
                  onChange={e => setEditingLeg({ ...editingLeg, arrivalDate: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Booking Reference</label>
                <input
                  type="text"
                  value={editingLeg.bookingRef}
                  onChange={e => setEditingLeg({ ...editingLeg, bookingRef: e.target.value })}
                  placeholder="e.g. QF1234"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                <textarea
                  value={editingLeg.notes}
                  onChange={e => setEditingLeg({ ...editingLeg, notes: e.target.value })}
                  placeholder="Terminal, port, check-in time..."
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setEditingLeg(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveLeg}
                disabled={!editingLeg.from.trim() || !editingLeg.to.trim()}
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
