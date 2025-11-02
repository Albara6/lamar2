'use client'

import { useEffect, useState } from 'react'

export const dynamic = 'force-dynamic'

export default function EmployeeExpensesAdmin() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/employee-expenses/list')
        const json = await res.json()
        if (res.ok) setRows(json.expenses || [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-2xl font-semibold text-gray-600">Loading employee expenses...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Employee Expenses</h1>
        <p className="text-gray-600 mt-1">Snacks/other deductions logged at the kiosk</p>
      </div>

      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent</h2>
        {rows.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No employee expenses found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">When</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Employee</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{new Date(r.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{r.employees?.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{r.description}</td>
                    <td className="px-4 py-3 text-sm font-bold text-blue-600 text-right">${Number(r.amount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
