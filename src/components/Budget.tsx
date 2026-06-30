import { useState } from 'react'
import type { BudgetItem } from '../types'

interface Props {
  items: BudgetItem[]
  travelers: number
  onChange: (items: BudgetItem[]) => void
}

function genId() {
  return Math.random().toString(36).slice(2)
}

const CATEGORIES = ['Flights', 'Accommodation', 'Food', 'Transport', 'Activities', 'Shopping', 'Insurance', 'Visas', 'Other']

const CATEGORY_ICONS: Record<string, string> = {
  Flights: '✈️', Accommodation: '🏨', Food: '🍜', Transport: '🚇',
  Activities: '🎟️', Shopping: '🛍️', Insurance: '🛡️', Visas: '📋', Other: '💰',
}

const CURRENCIES = ['AUD', 'USD', 'EUR', 'GBP', 'JPY', 'THB', 'SGD', 'NZD', 'CAD', 'HKD']

export default function Budget({ items, travelers, onChange }: Props) {
  const [newItem, setNewItem] = useState<Omit<BudgetItem, 'id'>>({
    category: 'Other', description: '', amount: 0, currency: 'AUD',
    date: new Date().toISOString().split('T')[0], type: 'expense',
  })
  const [baseCurrency, setBaseCurrency] = useState('AUD')
  const [filterCat, setFilterCat] = useState('All')

  const remove = (id: string) => onChange(items.filter(i => i.id !== id))

  const add = () => {
    if (!newItem.description.trim() || newItem.amount <= 0) return
    onChange([...items, { ...newItem, id: genId() }])
    setNewItem({ ...newItem, description: '', amount: 0 })
  }

  const expenses = items.filter(i => i.type === 'expense')
  const budgets = items.filter(i => i.type === 'budget')

  const totalExpense = expenses.reduce((s, i) => s + i.amount, 0)
  const totalBudget = budgets.reduce((s, i) => s + i.amount, 0)
  const perPerson = travelers > 0 ? totalExpense / travelers : totalExpense

  const byCategory = CATEGORIES.map(cat => ({
    cat,
    total: expenses.filter(i => i.category === cat).reduce((s, i) => s + i.amount, 0),
  })).filter(c => c.total > 0)

  const filtered = filterCat === 'All' ? items : items.filter(i => i.category === filterCat)

  const fmt = (n: number, cur = baseCurrency) =>
    new Intl.NumberFormat('en-AU', { style: 'currency', currency: cur, minimumFractionDigits: 0 }).format(n)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl p-5 text-white">
          <p className="text-indigo-200 text-sm">Total Spent</p>
          <p className="text-3xl font-bold mt-1">{fmt(totalExpense)}</p>
          <p className="text-indigo-200 text-xs mt-1">{fmt(perPerson)} per person</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-5 text-white">
          <p className="text-emerald-100 text-sm">Total Budget</p>
          <p className="text-3xl font-bold mt-1">{fmt(totalBudget)}</p>
        </div>
        <div className={`rounded-xl p-5 text-white ${totalBudget > 0 && totalExpense > totalBudget ? 'bg-gradient-to-br from-red-500 to-rose-600' : 'bg-gradient-to-br from-violet-500 to-purple-600'}`}>
          <p className="text-violet-100 text-sm">Remaining</p>
          <p className="text-3xl font-bold mt-1">{totalBudget > 0 ? fmt(totalBudget - totalExpense) : '–'}</p>
          {totalBudget > 0 && (
            <div className="mt-2 h-1.5 bg-white/20 rounded-full">
              <div className="h-full bg-white rounded-full" style={{ width: `${Math.min(100, (totalExpense / totalBudget) * 100)}%` }} />
            </div>
          )}
        </div>
      </div>

      {byCategory.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm font-semibold text-gray-700 mb-3">Spending by Category</p>
          <div className="space-y-2">
            {byCategory.sort((a, b) => b.total - a.total).map(({ cat, total }) => (
              <div key={cat} className="flex items-center gap-3">
                <span className="w-6 text-center">{CATEGORY_ICONS[cat]}</span>
                <span className="text-sm text-gray-600 w-32">{cat}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: totalExpense ? `${(total / totalExpense) * 100}%` : '0%' }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700 w-20 text-right">{fmt(total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap items-center">
        {['All', ...CATEGORIES].map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filterCat === cat ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat !== 'All' ? CATEGORY_ICONS[cat] : ''} {cat}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-400">Display in:</span>
          <select
            value={baseCurrency}
            onChange={e => setBaseCurrency(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {CURRENCIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-center text-gray-400 py-8">No entries yet — add your first expense or budget item below</p>
        )}
        {filtered.map(item => (
          <div key={item.id} className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3">
            <span className="text-lg">{CATEGORY_ICONS[item.category] || '💰'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{item.description}</p>
              <p className="text-xs text-gray-400">{item.category} · {item.date}</p>
            </div>
            <span className={`text-sm font-semibold ${item.type === 'budget' ? 'text-emerald-600' : 'text-gray-800'}`}>
              {item.type === 'budget' ? '📋 ' : ''}{fmt(item.amount, item.currency)} {item.currency !== baseCurrency ? item.currency : ''}
            </span>
            <button onClick={() => remove(item.id)} className="text-gray-300 hover:text-red-400 text-sm">✕</button>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Add Entry</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
          <select
            value={newItem.type}
            onChange={e => setNewItem({ ...newItem, type: e.target.value as 'expense' | 'budget' })}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="expense">Expense</option>
            <option value="budget">Budget</option>
          </select>
          <select
            value={newItem.category}
            onChange={e => setNewItem({ ...newItem, category: e.target.value })}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select
            value={newItem.currency}
            onChange={e => setNewItem({ ...newItem, currency: e.target.value })}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {CURRENCIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <input
            type="date"
            value={newItem.date}
            onChange={e => setNewItem({ ...newItem, date: e.target.value })}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newItem.description}
            onChange={e => setNewItem({ ...newItem, description: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && add()}
            placeholder="Description (e.g. Flight to Tokyo)"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="number"
            min={0}
            step={0.01}
            value={newItem.amount || ''}
            onChange={e => setNewItem({ ...newItem, amount: parseFloat(e.target.value) || 0 })}
            placeholder="Amount"
            className="w-28 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={add}
            disabled={!newItem.description.trim() || newItem.amount <= 0}
            className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-40"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
