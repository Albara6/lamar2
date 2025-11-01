'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default function Deposits() {
  const [deposits, setDeposits] = useState<any[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [newDeposit, setNewDeposit] = useState({
    vendor_id: '',
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data: depositsData } = await supabase
        .from('deposits')
        .select('*, vendors(name), users(name)')
        .order('date', { ascending: false })

      const { data: vendorsData } = await supabase
        .from('vendors')
        .select('*')
        .eq('type', 'deposit_source')
        .eq('active', true)

      setDeposits(depositsData || [])
      setVendors(vendorsData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddDeposit = async () => {
    if (!newDeposit.vendor_id || !newDeposit.amount || parseFloat(newDeposit.amount) <= 0) {
      alert('Please fill in all required fields')
      return
    }

    // Get first user as placeholder for created_by
    const { data: users } = await supabase.from('users').select('id').limit(1).single()
    
    if (!users) {
      alert('Error: No users found. Please add users first.')
      return
    }

    const { error } = await supabase.from('deposits').insert([{
      vendor_id: newDeposit.vendor_id,
      amount: parseFloat(newDeposit.amount),
      date: newDeposit.date,
      notes: newDeposit.notes || null,
      created_by_user_id: (users as any).id,
    }] as any)

    if (!error) {
      setNewDeposit({
        vendor_id: '',
        amount: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        notes: '',
      })
      setShowModal(false)
      loadData()
    } else {
      alert('Failed to add deposit: ' + error.message)
    }
  }

  const handleDeleteDeposit = async (id: string) => {
    if (!confirm('Are you sure you want to delete this deposit?')) return

    const { error } = await supabase.from('deposits').delete().eq('id', id)

    if (!error) {
      loadData()
    }
  }

  const exportToCSV = () => {
    const headers = ['Date', 'Source', 'Amount', 'Notes', 'Created By']
    const csv = [
      headers.join(','),
      ...deposits.map((d) =>
        [d.date, d.vendors?.name, d.amount.toFixed(2), `"${d.notes || ''}"`, d.users?.name].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `deposits-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-2xl font-semibold text-gray-600">Loading deposits...</div>
      </div>
    )
  }

  const totalDeposits = deposits.reduce((sum: number, d: any) => sum + d.amount, 0)

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Bank Deposits</h1>
        <p className="text-gray-600 mt-1">Track deposits by source</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="text-sm font-medium mb-2 text-purple-100">Total Deposits</div>
          <div className="text-4xl font-bold">${totalDeposits.toFixed(2)}</div>
        </div>
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="text-sm font-medium mb-2 text-blue-100">This Month</div>
          <div className="text-4xl font-bold">
            $
            {deposits
              .filter((d: any) => d.date.startsWith(format(new Date(), 'yyyy-MM')))
              .reduce((sum: number, d: any) => sum + d.amount, 0)
              .toFixed(2)}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4 mb-6">
        <button onClick={() => setShowModal(true)} className="btn-primary">
          Add Deposit
        </button>
        <button onClick={exportToCSV} className="btn-secondary">
          Export CSV
        </button>
      </div>

      {/* Deposits Table */}
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Deposit History</h2>
        {deposits.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No deposits recorded</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Source</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Notes</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Created By</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {deposits.map((deposit) => (
                  <tr key={deposit.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {format(new Date(deposit.date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{deposit.vendors?.name}</td>
                    <td className="px-4 py-3 text-sm font-bold text-purple-600 text-right">
                      ${deposit.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{deposit.notes || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{deposit.users?.name}</td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => handleDeleteDeposit(deposit.id)}
                        className="text-red-600 hover:text-red-700 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Deposit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Bank Deposit</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deposit Source *
                </label>
                <select
                  value={newDeposit.vendor_id}
                  onChange={(e) => setNewDeposit({ ...newDeposit, vendor_id: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select source...</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  value={newDeposit.amount}
                  onChange={(e) => setNewDeposit({ ...newDeposit, amount: e.target.value })}
                  className="input-field"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                <input
                  type="date"
                  value={newDeposit.date}
                  onChange={(e) => setNewDeposit({ ...newDeposit, date: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={newDeposit.notes}
                  onChange={(e) => setNewDeposit({ ...newDeposit, notes: e.target.value })}
                  className="input-field"
                  rows={3}
                  placeholder="Optional notes..."
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button onClick={handleAddDeposit} className="flex-1 btn-primary">
                Add Deposit
              </button>
              <button onClick={() => setShowModal(false)} className="flex-1 btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

