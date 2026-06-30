import { useState } from 'react'
import type { PackingItem } from '../types'

interface Props {
  items: PackingItem[]
  onChange: (items: PackingItem[]) => void
}

function genId() {
  return Math.random().toString(36).slice(2)
}

const DEFAULT_CATEGORIES = [
  'Documents', 'Clothing', 'Toiletries', 'Electronics', 'Health', 'Money', 'Entertainment', 'Other',
]

const CATEGORY_ICONS: Record<string, string> = {
  Documents: '📄',
  Clothing: '👕',
  Toiletries: '🧴',
  Electronics: '🔌',
  Health: '💊',
  Money: '💳',
  Entertainment: '🎵',
  Other: '📦',
}

const DEFAULT_ITEMS: Omit<PackingItem, 'id'>[] = [
  { name: 'Passport', category: 'Documents', packed: false, quantity: 1 },
  { name: 'Travel insurance docs', category: 'Documents', packed: false, quantity: 1 },
  { name: 'Flight tickets / boarding passes', category: 'Documents', packed: false, quantity: 1 },
  { name: 'Hotel booking confirmations', category: 'Documents', packed: false, quantity: 1 },
  { name: 'Phone charger', category: 'Electronics', packed: false, quantity: 1 },
  { name: 'Power adapter', category: 'Electronics', packed: false, quantity: 1 },
  { name: 'Headphones', category: 'Electronics', packed: false, quantity: 1 },
  { name: 'Sunscreen', category: 'Toiletries', packed: false, quantity: 1 },
  { name: 'Toothbrush & toothpaste', category: 'Toiletries', packed: false, quantity: 1 },
  { name: 'Deodorant', category: 'Toiletries', packed: false, quantity: 1 },
  { name: 'Prescription medications', category: 'Health', packed: false, quantity: 1 },
  { name: 'Pain relievers', category: 'Health', packed: false, quantity: 1 },
  { name: 'Credit card', category: 'Money', packed: false, quantity: 1 },
  { name: 'Local currency cash', category: 'Money', packed: false, quantity: 1 },
]

export default function PackingList({ items, onChange }: Props) {
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState('Other')
  const [newQty, setNewQty] = useState(1)
  const [filterCategory, setFilterCategory] = useState<string>('All')

  const toggle = (id: string) =>
    onChange(items.map(i => (i.id === id ? { ...i, packed: !i.packed } : i)))

  const remove = (id: string) => onChange(items.filter(i => i.id !== id))

  const add = () => {
    if (!newName.trim()) return
    onChange([...items, { id: genId(), name: newName.trim(), category: newCategory, packed: false, quantity: newQty }])
    setNewName('')
    setNewQty(1)
  }

  const loadDefaults = () => {
    const existing = new Set(items.map(i => i.name.toLowerCase()))
    const toAdd = DEFAULT_ITEMS
      .filter(i => !existing.has(i.name.toLowerCase()))
      .map(i => ({ ...i, id: genId() }))
    onChange([...items, ...toAdd])
  }

  const categories = DEFAULT_CATEGORIES.filter(c =>
    items.some(i => i.category === c)
  )
  const allCategories = ['All', ...categories]
  const filtered = filterCategory === 'All' ? items : items.filter(i => i.category === filterCategory)
  const packed = items.filter(i => i.packed).length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            {packed} / {items.length} items packed
          </p>
          <div className="mt-1.5 h-2 w-48 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: items.length ? `${(packed / items.length) * 100}%` : '0%' }}
            />
          </div>
        </div>
        {items.length === 0 && (
          <button
            onClick={loadDefaults}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-200 px-4 py-2 rounded-xl hover:bg-indigo-50"
          >
            Load starter list
          </button>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {allCategories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filterCategory === cat
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat !== 'All' ? CATEGORY_ICONS[cat] : ''} {cat}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-center text-gray-400 py-8">No items in this category</p>
        )}
        {DEFAULT_CATEGORIES.map(cat => {
          const catItems = filtered.filter(i => i.category === cat)
          if (catItems.length === 0) return null
          return (
            <div key={cat}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
                {CATEGORY_ICONS[cat]} {cat}
              </p>
              <div className="space-y-1.5">
                {catItems.map(item => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                      item.packed ? 'bg-green-50 border-green-100' : 'bg-white border-gray-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={item.packed}
                      onChange={() => toggle(item.id)}
                      className="w-4 h-4 accent-green-600 cursor-pointer"
                    />
                    <span className={`flex-1 text-sm ${item.packed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {item.name}
                    </span>
                    {item.quantity > 1 && (
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        x{item.quantity}
                      </span>
                    )}
                    <button
                      onClick={() => remove(item.id)}
                      className="text-gray-300 hover:text-red-400 text-sm px-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
        {filtered.some(i => !DEFAULT_CATEGORIES.includes(i.category)) && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
              📦 Other
            </p>
            <div className="space-y-1.5">
              {filtered
                .filter(i => !DEFAULT_CATEGORIES.includes(i.category))
                .map(item => (
                  <div key={item.id} className={`flex items-center gap-3 p-3 rounded-xl border ${item.packed ? 'bg-green-50 border-green-100' : 'bg-white border-gray-100'}`}>
                    <input type="checkbox" checked={item.packed} onChange={() => toggle(item.id)} className="w-4 h-4 accent-green-600 cursor-pointer" />
                    <span className={`flex-1 text-sm ${item.packed ? 'line-through text-gray-400' : 'text-gray-800'}`}>{item.name}</span>
                    <button onClick={() => remove(item.id)} className="text-gray-300 hover:text-red-400 text-sm px-1">✕</button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 pt-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Add item</p>
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
            placeholder="Item name"
            className="flex-1 min-w-0 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            {DEFAULT_CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <input
            type="number"
            min={1}
            value={newQty}
            onChange={e => setNewQty(parseInt(e.target.value) || 1)}
            className="w-16 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={add}
            disabled={!newName.trim()}
            className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-40"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
