import type { TripInfo } from '../types'

interface Props {
  trip: TripInfo
  onChange: (trip: TripInfo) => void
}

const EMOJIS: Record<string, string> = {
  destination: '✈️',
  dates: '📅',
  travelers: '👥',
  notes: '📝',
}

export default function TripOverview({ trip, onChange }: Props) {
  const update = (field: keyof TripInfo, value: string | number) =>
    onChange({ ...trip, [field]: value })

  const nights =
    trip.departureDate && trip.returnDate
      ? Math.max(
          0,
          Math.round(
            (new Date(trip.returnDate).getTime() - new Date(trip.departureDate).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : 0

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-1">
          {trip.destination || 'Your Holiday'}{' '}
          {trip.country ? `🇺🇳 ${trip.country}` : ''}
        </h2>
        {nights > 0 && (
          <p className="text-blue-100 text-lg">
            {nights} night{nights !== 1 ? 's' : ''} •{' '}
            {trip.travelers} traveller{trip.travelers !== 1 ? 's' : ''}
          </p>
        )}
        {trip.departureDate && trip.returnDate && (
          <p className="text-blue-200 mt-1">
            {new Date(trip.departureDate).toLocaleDateString('en-AU', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}{' '}
            →{' '}
            {new Date(trip.returnDate).toLocaleDateString('en-AU', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <label className="block text-sm font-medium text-gray-500 mb-1">
            {EMOJIS.destination} Destination City
          </label>
          <input
            type="text"
            value={trip.destination}
            onChange={e => update('destination', e.target.value)}
            placeholder="e.g. Tokyo"
            className="w-full text-lg font-semibold text-gray-900 border-0 outline-none bg-transparent placeholder-gray-300"
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Country
          </label>
          <input
            type="text"
            value={trip.country}
            onChange={e => update('country', e.target.value)}
            placeholder="e.g. Japan"
            className="w-full text-lg font-semibold text-gray-900 border-0 outline-none bg-transparent placeholder-gray-300"
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <label className="block text-sm font-medium text-gray-500 mb-1">
            {EMOJIS.dates} Departure Date
          </label>
          <input
            type="date"
            value={trip.departureDate}
            onChange={e => update('departureDate', e.target.value)}
            className="w-full text-lg font-semibold text-gray-900 border-0 outline-none bg-transparent"
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <label className="block text-sm font-medium text-gray-500 mb-1">
            {EMOJIS.dates} Return Date
          </label>
          <input
            type="date"
            value={trip.returnDate}
            onChange={e => update('returnDate', e.target.value)}
            className="w-full text-lg font-semibold text-gray-900 border-0 outline-none bg-transparent"
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <label className="block text-sm font-medium text-gray-500 mb-1">
            {EMOJIS.travelers} Number of Travellers
          </label>
          <input
            type="number"
            min={1}
            max={20}
            value={trip.travelers}
            onChange={e => update('travelers', parseInt(e.target.value) || 1)}
            className="w-full text-lg font-semibold text-gray-900 border-0 outline-none bg-transparent"
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm md:col-span-1">
          <label className="block text-sm font-medium text-gray-500 mb-1">
            {EMOJIS.notes} Trip Notes
          </label>
          <textarea
            value={trip.notes}
            onChange={e => update('notes', e.target.value)}
            placeholder="Visa requirements, entry conditions, general notes..."
            rows={3}
            className="w-full text-sm text-gray-700 border-0 outline-none bg-transparent resize-none placeholder-gray-300"
          />
        </div>
      </div>
    </div>
  )
}
