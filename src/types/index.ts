export type Tab = 'overview' | 'itinerary' | 'packing' | 'budget' | 'documents'

export type LegType = 'flight' | 'cruise' | 'train' | 'ferry' | 'drive' | 'bus' | 'other'

export const LEG_TYPE_CONFIG: Record<LegType, { icon: string; label: string }> = {
  flight:  { icon: '✈️', label: 'Flight' },
  cruise:  { icon: '🚢', label: 'Cruise' },
  train:   { icon: '🚂', label: 'Train' },
  ferry:   { icon: '⛴️', label: 'Ferry' },
  drive:   { icon: '🚗', label: 'Drive' },
  bus:     { icon: '🚌', label: 'Bus' },
  other:   { icon: '🗺️', label: 'Other' },
}

export const LEG_COLORS = [
  { bg: 'bg-blue-50',   badge: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-400',    bar: 'bg-blue-400' },
  { bg: 'bg-cyan-50',   badge: 'bg-cyan-100 text-cyan-700',     dot: 'bg-cyan-400',    bar: 'bg-cyan-400' },
  { bg: 'bg-violet-50', badge: 'bg-violet-100 text-violet-700', dot: 'bg-violet-400',  bar: 'bg-violet-400' },
  { bg: 'bg-amber-50',  badge: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-400',   bar: 'bg-amber-400' },
  { bg: 'bg-rose-50',   badge: 'bg-rose-100 text-rose-700',     dot: 'bg-rose-400',    bar: 'bg-rose-400' },
]

export interface Leg {
  id: string
  type: LegType
  from: string
  to: string
  departureDate: string
  arrivalDate: string
  bookingRef: string
  notes: string
}

export interface TripInfo {
  name: string
  travelers: number
  notes: string
  legs: Leg[]
}

export interface Activity {
  id: string
  time: string
  title: string
  location: string
  notes: string
  done: boolean
}

export interface DayPlan {
  date: string
  activities: Activity[]
}

export interface PackingItem {
  id: string
  name: string
  category: string
  packed: boolean
  quantity: number
}

export interface BudgetItem {
  id: string
  category: string
  description: string
  amount: number
  currency: string
  date: string
  type: 'expense' | 'budget'
}

export interface Document {
  id: string
  name: string
  status: 'ready' | 'pending' | 'not-started'
  expiryDate: string
  notes: string
}

export interface AppState {
  trip: TripInfo
  itinerary: DayPlan[]
  packing: PackingItem[]
  budget: BudgetItem[]
  documents: Document[]
}
