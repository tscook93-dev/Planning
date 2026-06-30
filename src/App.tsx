import { useState } from 'react'
import type { Tab, AppState } from './types'
import { useLocalStorage } from './hooks/useLocalStorage'
import TripOverview from './components/TripOverview'
import Itinerary from './components/Itinerary'
import PackingList from './components/PackingList'
import Budget from './components/Budget'
import Documents from './components/Documents'

const DEFAULT_STATE: AppState = {
  trip: {
    name: '',
    travelers: 2,
    notes: '',
    legs: [],
  },
  itinerary: [],
  packing: [],
  budget: [],
  documents: [],
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'overview',  label: 'Overview',  icon: '🗺️' },
  { id: 'itinerary', label: 'Itinerary', icon: '📅' },
  { id: 'packing',   label: 'Packing',   icon: '🧳' },
  { id: 'budget',    label: 'Budget',    icon: '💰' },
  { id: 'documents', label: 'Documents', icon: '📄' },
]

function App() {
  const [rawState, setState] = useLocalStorage<AppState>('holiday-planner', DEFAULT_STATE)
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  // Migrate old schema (destination/departureDate/returnDate → legs)
  const state: AppState = {
    ...DEFAULT_STATE,
    ...rawState,
    trip: {
      ...DEFAULT_STATE.trip,
      ...rawState.trip,
      legs: rawState.trip.legs ?? [],
    },
  }

  const update = <K extends keyof AppState>(key: K, value: AppState[K]) =>
    setState(prev => ({ ...prev, [key]: value }))

  const tripStart = state.trip.legs.map(l => l.departureDate).filter(Boolean).sort()[0] ?? ''
  const tripEnd = state.trip.legs.map(l => l.arrivalDate).filter(Boolean).sort().at(-1) ?? ''

  const fmtDate = (d: string) =>
    d ? new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

  const packedCount = state.packing.filter(i => i.packed).length
  const docsReady  = state.documents.filter(d => d.status === 'ready').length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6 pb-28">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {state.trip.name || 'Holiday Planner'}
          </h1>
          {tripStart && (
            <p className="text-sm text-gray-400 mt-0.5">
              {fmtDate(tripStart)}{tripEnd ? ` – ${fmtDate(tripEnd)}` : ''}
            </p>
          )}
        </header>

        {activeTab === 'overview' && (
          <TripOverview trip={state.trip} onChange={v => update('trip', v)} />
        )}
        {activeTab === 'itinerary' && (
          <Itinerary
            itinerary={state.itinerary}
            legs={state.trip.legs}
            onChange={v => update('itinerary', v)}
          />
        )}
        {activeTab === 'packing' && (
          <PackingList items={state.packing} onChange={v => update('packing', v)} />
        )}
        {activeTab === 'budget' && (
          <Budget items={state.budget} travelers={state.trip.travelers} onChange={v => update('budget', v)} />
        )}
        {activeTab === 'documents' && (
          <Documents documents={state.documents} onChange={v => update('documents', v)} />
        )}
      </div>

      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-40">
        <div className="max-w-2xl mx-auto flex">
          {TABS.map(tab => {
            const badge =
              tab.id === 'packing'   && state.packing.length   > 0 ? `${packedCount}/${state.packing.length}` :
              tab.id === 'documents' && state.documents.length  > 0 ? `${docsReady}/${state.documents.length}` :
              null
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center py-3 gap-0.5 relative transition-colors ${
                  activeTab === tab.id ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {activeTab === tab.id && (
                  <span className="absolute top-0 inset-x-0 h-0.5 bg-indigo-600 rounded-b" />
                )}
                <span className="text-xl leading-none">{tab.icon}</span>
                <span className="text-xs font-medium">{tab.label}</span>
                {badge && (
                  <span className="absolute top-1.5 right-3 text-xs bg-indigo-100 text-indigo-600 rounded-full px-1.5 py-0.5 font-medium">
                    {badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

export default App
