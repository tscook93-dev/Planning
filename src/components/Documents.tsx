import { useState } from 'react'
import type { Document } from '../types'

interface Props {
  documents: Document[]
  onChange: (docs: Document[]) => void
}

function genId() {
  return Math.random().toString(36).slice(2)
}

const DEFAULT_DOCS: Omit<Document, 'id'>[] = [
  { name: 'Passport', status: 'not-started', expiryDate: '', notes: 'Must be valid for 6+ months after travel' },
  { name: 'Visa', status: 'not-started', expiryDate: '', notes: '' },
  { name: 'Travel Insurance', status: 'not-started', expiryDate: '', notes: 'Check medical, cancellation & luggage cover' },
  { name: 'Flight Tickets', status: 'not-started', expiryDate: '', notes: '' },
  { name: 'Accommodation Bookings', status: 'not-started', expiryDate: '', notes: '' },
  { name: 'International Driving Permit', status: 'not-started', expiryDate: '', notes: '' },
  { name: 'Vaccination Records', status: 'not-started', expiryDate: '', notes: '' },
  { name: 'Emergency Contact List', status: 'not-started', expiryDate: '', notes: '' },
]

const STATUS_CONFIG = {
  ready: { label: 'Ready', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  pending: { label: 'In Progress', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
  'not-started': { label: 'Not Started', color: 'bg-gray-100 text-gray-500', dot: 'bg-gray-300' },
}

export default function Documents({ documents, onChange }: Props) {
  const [newDoc, setNewDoc] = useState<Omit<Document, 'id'>>({
    name: '', status: 'not-started', expiryDate: '', notes: '',
  })
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const update = (id: string, patch: Partial<Document>) =>
    onChange(documents.map(d => (d.id === id ? { ...d, ...patch } : d)))

  const remove = (id: string) => onChange(documents.filter(d => d.id !== id))

  const add = () => {
    if (!newDoc.name.trim()) return
    onChange([...documents, { ...newDoc, id: genId() }])
    setNewDoc({ name: '', status: 'not-started', expiryDate: '', notes: '' })
  }

  const loadDefaults = () => {
    const existing = new Set(documents.map(d => d.name.toLowerCase()))
    const toAdd = DEFAULT_DOCS
      .filter(d => !existing.has(d.name.toLowerCase()))
      .map(d => ({ ...d, id: genId() }))
    onChange([...documents, ...toAdd])
  }

  const ready = documents.filter(d => d.status === 'ready').length
  const pending = documents.filter(d => d.status === 'pending').length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{ready}</p>
            <p className="text-xs text-gray-400">Ready</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-500">{pending}</p>
            <p className="text-xs text-gray-400">In Progress</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-400">{documents.length - ready - pending}</p>
            <p className="text-xs text-gray-400">Not Started</p>
          </div>
        </div>
        {documents.length === 0 && (
          <button
            onClick={loadDefaults}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-200 px-4 py-2 rounded-xl hover:bg-indigo-50"
          >
            Load starter list
          </button>
        )}
      </div>

      <div className="space-y-2">
        {documents.length === 0 && (
          <p className="text-center text-gray-400 py-8">No documents tracked yet</p>
        )}
        {documents.map(doc => {
          const cfg = STATUS_CONFIG[doc.status]
          const isExpanded = expandedId === doc.id
          const isExpiring = doc.expiryDate && new Date(doc.expiryDate) < new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)

          return (
            <div key={doc.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedId(isExpanded ? null : doc.id)}
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                <p className="flex-1 text-sm font-medium text-gray-800">{doc.name}</p>
                {isExpiring && (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Expiring soon</span>
                )}
                <select
                  value={doc.status}
                  onChange={e => {
                    e.stopPropagation()
                    update(doc.id, { status: e.target.value as Document['status'] })
                  }}
                  onClick={e => e.stopPropagation()}
                  className={`text-xs font-medium border-0 rounded-full px-3 py-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${cfg.color}`}
                >
                  <option value="not-started">Not Started</option>
                  <option value="pending">In Progress</option>
                  <option value="ready">Ready</option>
                </select>
                <button
                  onClick={e => { e.stopPropagation(); remove(doc.id) }}
                  className="text-gray-300 hover:text-red-400 text-sm"
                >
                  ✕
                </button>
              </div>

              {isExpanded && (
                <div className="border-t border-gray-100 px-4 py-3 space-y-3 bg-gray-50">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Expiry Date</label>
                    <input
                      type="date"
                      value={doc.expiryDate}
                      onChange={e => update(doc.id, { expiryDate: e.target.value })}
                      className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                    <textarea
                      value={doc.notes}
                      onChange={e => update(doc.id, { notes: e.target.value })}
                      placeholder="Reference numbers, requirements, links..."
                      rows={2}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="border-t border-gray-100 pt-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Add document</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={newDoc.name}
            onChange={e => setNewDoc({ ...newDoc, name: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && add()}
            placeholder="Document name (e.g. Travel Insurance)"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={add}
            disabled={!newDoc.name.trim()}
            className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-40"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
