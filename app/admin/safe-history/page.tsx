'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

export default function SafeHistory() {
  const [drops, setDrops] = useState<any[]>([])
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [filter, setFilter] = useState<'all' | 'drops' | 'withdrawals'>('all')
  const [dateFilter, setDateFilter] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    setLoading(true)
    try {
      const { data: dropsData } = await supabase
        .from('safe_drops')
        .select('*, users(name)')
        .order('timestamp', { ascending: false })

      const { data: withdrawalsData } = await supabase
        .from('withdrawals')
        .select('*, users(name)')
        .order('timestamp', { ascending: false })

      setDrops(dropsData || [])
      setWithdrawals(withdrawalsData || [])
    } catch (error) {
      console.error('Error loading history:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredDrops = dateFilter
    ? drops.filter((d) => d.timestamp.startsWith(dateFilter))
    : drops

  const filteredWithdrawals = dateFilter
    ? withdrawals.filter((w) => w.timestamp.startsWith(dateFilter))
    : withdrawals

  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'User', 'Amount', 'Receipt/ID', 'Notes']
    const allTransactions = [
      ...filteredDrops.map((d) => ({
        date: d.timestamp,
        type: 'Drop',
        user: d.users?.name,
        amount: d.amount,
        id: d.receipt_number,
        notes: d.notes || '',
      })),
      ...filteredWithdrawals.map((w) => ({
        date: w.timestamp,
        type: 'Withdrawal',
        user: w.users?.name,
        amount: -w.amount,
        id: w.id,
        notes: w.reason || '',
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const csv = [
      headers.join(','),
      ...allTransactions.map((t) =>
        [
          format(new Date(t.date), 'yyyy-MM-dd HH:mm'),
          t.type,
          t.user,
          t.amount.toFixed(2),
          t.id,
          `"${t.notes}"`,
        ].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `safe-history-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-2xl font-semibold text-gray-600">Loading history...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Safe History</h1>
        <p className="text-gray-600 mt-1">All drops and withdrawals</p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg ${
                  filter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('drops')}
                className={`px-4 py-2 rounded-lg ${
                  filter === 'drops' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                Drops
              </button>
              <button
                onClick={() => setFilter('withdrawals')}
                className={`px-4 py-2 rounded-lg ${
                  filter === 'withdrawals' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                Withdrawals
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Date</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="ml-auto">
            <button onClick={exportToCSV} className="btn-primary">
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Drops */}
      {(filter === 'all' || filter === 'drops') && (
        <div className="card mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Safe Drops</h2>
          {filteredDrops.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No drops found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date & Time</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">User</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Receipt #</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Amount</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredDrops.map((drop) => (
                    <tr key={drop.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {format(new Date(drop.timestamp), 'MMM d, yyyy h:mm a')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{drop.users?.name}</td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-600">
                        {drop.receipt_number}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-green-600 text-right">
                        +${drop.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{drop.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Withdrawals */}
      {(filter === 'all' || filter === 'withdrawals') && (
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Withdrawals</h2>
          {filteredWithdrawals.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No withdrawals found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date & Time</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Manager</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Amount</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredWithdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {format(new Date(withdrawal.timestamp), 'MMM d, yyyy h:mm a')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{withdrawal.users?.name}</td>
                      <td className="px-4 py-3 text-sm font-bold text-yellow-600 text-right">
                        -${withdrawal.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{withdrawal.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

