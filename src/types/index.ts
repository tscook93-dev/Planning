export type Tab = 'overview' | 'itinerary' | 'packing' | 'budget' | 'documents'

export interface TripInfo {
  destination: string
  country: string
  departureDate: string
  returnDate: string
  travelers: number
  notes: string
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
