'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

export default function Expenses() {
  const [expenses, setExpenses] = useState<any[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [showVendorModal, setShowVendorModal] = useState(false)
  const [newVendor, setNewVendor] = useState({ name: '', type: 'vendor' as 'vendor' | 'deposit_source' })
  const [editingVendor, setEditingVendor] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data: expensesData } = await supabase
        .from('expenses')
        .select('*, vendors(name), users(name)')
        .order('date', { ascending: false })

      const { data: vendorsData } = await supabase
        .from('vendors')
        .select('*')
        .order('name')

      setExpenses(expensesData || [])
      setVendors(vendorsData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddVendor = async () => {
    if (!newVendor.name.trim()) return

    const { data, error } = await supabase.from('vendors').insert([newVendor] as any).select().single()

    if (!error && data) {
      setNewVendor({ name: '', type: 'vendor' })
      setShowVendorModal(false)
      loadData()
    }
  }

  const handleUpdateVendor = async () => {
    if (!editingVendor) return

    const { error } = await (supabase as any)
      .from('vendors')
      .update({ name: editingVendor.name, active: editingVendor.active })
      .eq('id', editingVendor.id)

    if (!error) {
      setEditingVendor(null)
      loadData()
    }
  }

  const exportToCSV = () => {
    const headers = ['Date', 'Vendor', 'Amount', 'Payment Type', 'User', 'Notes']
    const csv = [
      headers.join(','),
      ...expenses.map((e) =>
        [
          e.date,
          e.vendors?.name,
          e.amount.toFixed(2),
          e.payment_type,
          e.users?.name,
          `"${e.notes || ''}"`,
        ].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `expenses-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-2xl font-semibold text-gray-600">Loading expenses...</div>
      </div>
    )
  }

  const totalExpenses = expenses.reduce((sum: number, e: any) => sum + e.amount, 0)

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
        <p className="text-gray-600 mt-1">Manage expenses and vendors</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
          <div className="text-sm font-medium mb-2 text-red-100">Total Expenses</div>
          <div className="text-4xl font-bold">${totalExpenses.toFixed(2)}</div>
        </div>
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="text-sm font-medium mb-2 text-blue-100">Total Vendors</div>
          <div className="text-4xl font-bold">{vendors.filter((v) => v.type === 'vendor').length}</div>
        </div>
        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="text-sm font-medium mb-2 text-green-100">This Month</div>
          <div className="text-4xl font-bold">
            $
            {expenses
              .filter((e: any) => e.date.startsWith(format(new Date(), 'yyyy-MM')))
              .reduce((sum: number, e: any) => sum + e.amount, 0)
              .toFixed(2)}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4 mb-6">
        <button onClick={() => setShowVendorModal(true)} className="btn-primary">
          Manage Vendors
        </button>
        <button onClick={exportToCSV} className="btn-secondary">
          Export CSV
        </button>
      </div>

      {/* Expenses Table */}
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Expense History</h2>
        {expenses.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No expenses recorded</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Vendor</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">User</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Notes</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {format(new Date(expense.date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{expense.vendors?.name}</td>
                    <td className="px-4 py-3 text-sm font-bold text-red-600 text-right">
                      ${expense.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          expense.payment_type === 'cash'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {expense.payment_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{expense.users?.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{expense.notes || '—'}</td>
                    <td className="px-4 py-3 text-sm">
                      {expense.receipt_url ? (
                        <a
                          href={expense.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700"
                        >
                          View
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Vendor Modal */}
      {showVendorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Manage Vendors</h2>

            {/* Add New Vendor */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">Add New Vendor</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newVendor.name}
                  onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                  placeholder="Vendor name"
                  className="input-field flex-1"
                />
                <button onClick={handleAddVendor} className="btn-primary">
                  Add
                </button>
              </div>
            </div>

            {/* Vendor List */}
            <div className="space-y-2 mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Existing Vendors</h3>
              {vendors
                .filter((v) => v.type === 'vendor')
                .map((vendor) =>
                  editingVendor?.id === vendor.id ? (
                    <div key={vendor.id} className="flex gap-2 p-3 bg-blue-50 rounded">
                      <input
                        type="text"
                        value={editingVendor.name}
                        onChange={(e) => setEditingVendor({ ...editingVendor, name: e.target.value })}
                        className="input-field flex-1"
                      />
                      <button onClick={handleUpdateVendor} className="btn-primary">
                        Save
                      </button>
                      <button onClick={() => setEditingVendor(null)} className="btn-secondary">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div
                      key={vendor.id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded hover:bg-gray-100"
                    >
                      <span className="text-gray-900">{vendor.name}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingVendor(vendor)}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={async () => {
                            await (supabase as any)
                              .from('vendors')
                              .update({ active: !vendor.active })
                              .eq('id', vendor.id)
                            loadData()
                          }}
                          className={`text-sm font-medium ${
                            vendor.active ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'
                          }`}
                        >
                          {vendor.active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </div>
                  )
                )}
            </div>

            <button onClick={() => setShowVendorModal(false)} className="btn-secondary w-full">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

