'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default function Shifts() {
  const [shifts, setShifts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadShifts()
  }, [])

  const loadShifts = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('shifts')
        .select('*, users(name)')
        .order('start_time', { ascending: false })

      setShifts(data || [])
    } catch (error) {
      console.error('Error loading shifts:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    const headers = [
      'Start Time',
      'End Time',
      'User',
      'Starting Drawer',
      'Ending Drawer',
      'Total Drops',
      'Total Expenses',
      'Variance',
    ]
    const csv = [
      headers.join(','),
      ...shifts.map((s) =>
        [
          s.start_time ? format(new Date(s.start_time), 'yyyy-MM-dd HH:mm') : '',
          s.end_time ? format(new Date(s.end_time), 'yyyy-MM-dd HH:mm') : 'In Progress',
          s.users?.name,
          s.starting_drawer_cash.toFixed(2),
          s.ending_drawer_cash?.toFixed(2) || '',
          s.total_drops.toFixed(2),
          s.total_expenses.toFixed(2),
          s.variance.toFixed(2),
        ].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `shifts-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-2xl font-semibold text-gray-600">Loading shifts...</div>
      </div>
    )
  }

  const totalShifts = shifts.filter((s) => s.end_time).length
  const shiftsWithVariance = shifts.filter((s) => s.end_time && s.variance !== 0).length
  const averageVariance =
    shifts.filter((s: any) => s.end_time).reduce((sum: number, s: any) => sum + Math.abs(s.variance), 0) / totalShifts || 0

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Shift Reports</h1>
        <p className="text-gray-600 mt-1">Track cashier performance and drawer reconciliation</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="text-sm font-medium mb-2 text-purple-100">Total Shifts</div>
          <div className="text-4xl font-bold">{totalShifts}</div>
        </div>
        <div className="card bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <div className="text-sm font-medium mb-2 text-yellow-100">Shifts with Variance</div>
          <div className="text-4xl font-bold">{shiftsWithVariance}</div>
        </div>
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="text-sm font-medium mb-2 text-blue-100">Avg Variance</div>
          <div className="text-4xl font-bold">${averageVariance.toFixed(2)}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4 mb-6">
        <button onClick={exportToCSV} className="btn-primary">
          Export CSV
        </button>
      </div>

      {/* Shifts Table */}
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Shift History</h2>
        {shifts.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No shifts recorded</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Start Time</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">End Time</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">User</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Starting $</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Ending $</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Drops</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Expenses</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {shifts.map((shift) => (
                  <tr key={shift.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {shift.start_time ? format(new Date(shift.start_time), 'MMM d, h:mm a') : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {shift.end_time ? (
                        format(new Date(shift.end_time), 'MMM d, h:mm a')
                      ) : (
                        <span className="text-blue-600 font-medium">In Progress</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{shift.users?.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      ${shift.starting_drawer_cash.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {shift.ending_drawer_cash ? `$${shift.ending_drawer_cash.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-green-600 font-semibold text-right">
                      ${shift.total_drops.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-red-600 font-semibold text-right">
                      ${shift.total_expenses.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-right">
                      <span
                        className={
                          shift.variance === 0
                            ? 'text-gray-600'
                            : shift.variance > 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }
                      >
                        {shift.variance > 0 && '+'}${shift.variance.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Performance Notes */}
      <div className="card mt-6">
        <h3 className="text-lg font-bold text-gray-900 mb-3">Understanding Shift Reports</h3>
        <div className="text-sm text-gray-600 space-y-2">
          <p>
            <strong>Variance:</strong> The difference between expected and actual ending drawer amounts.
          </p>
          <p>
            <strong>Positive Variance:</strong> Drawer has more cash than expected (over).
          </p>
          <p>
            <strong>Negative Variance:</strong> Drawer has less cash than expected (short).
          </p>
          <p>
            <strong>Zero Variance:</strong> Perfect balance - drawer matches expectations exactly.
          </p>
        </div>
      </div>
    </div>
  )
}

