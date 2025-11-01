'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns'

export const dynamic = 'force-dynamic'

export default function Sales() {
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'week' | 'month'>('all')

  useEffect(() => {
    loadSales()
  }, [])

  const loadSales = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('daily_sales')
        .select('*, users(name)')
        .order('date', { ascending: false })

      setSales(data || [])
    } catch (error) {
      console.error('Error loading sales:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredSales = () => {
    const now = new Date()
    switch (filter) {
      case 'week':
        const weekStart = format(startOfWeek(now), 'yyyy-MM-dd')
        const weekEnd = format(endOfWeek(now), 'yyyy-MM-dd')
        return sales.filter((s) => s.date >= weekStart && s.date <= weekEnd)
      case 'month':
        const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
        const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd')
        return sales.filter((s) => s.date >= monthStart && s.date <= monthEnd)
      default:
        return sales
    }
  }

  const filteredSales = getFilteredSales()
  const totalCardSales = filteredSales.reduce((sum: number, s: any) => sum + s.card_sales, 0)
  const totalCashSales = filteredSales.reduce((sum: number, s: any) => sum + s.cash_sales, 0)
  const totalSales = totalCardSales + totalCashSales

  const exportToCSV = () => {
    const headers = ['Date', 'Card Sales', 'Cash Sales', 'Total Sales', 'Variance', 'Closed By']
    const csv = [
      headers.join(','),
      ...filteredSales.map((s) =>
        [
          s.date,
          s.card_sales.toFixed(2),
          s.cash_sales.toFixed(2),
          s.total_sales.toFixed(2),
          s.variance.toFixed(2),
          s.users?.name || '',
        ].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sales-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-2xl font-semibold text-gray-600">Loading sales...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Daily Sales</h1>
        <p className="text-gray-600 mt-1">Track card and cash sales</p>
      </div>

      {/* Filter */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          All Time
        </button>
        <button
          onClick={() => setFilter('week')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'week' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          This Week
        </button>
        <button
          onClick={() => setFilter('month')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'month' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          This Month
        </button>
        <button onClick={exportToCSV} className="btn-primary ml-auto">
          Export CSV
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="text-sm font-medium mb-2 text-blue-100">Total Card Sales</div>
          <div className="text-4xl font-bold">${totalCardSales.toFixed(2)}</div>
        </div>
        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="text-sm font-medium mb-2 text-green-100">Total Cash Sales</div>
          <div className="text-4xl font-bold">${totalCashSales.toFixed(2)}</div>
        </div>
        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="text-sm font-medium mb-2 text-purple-100">Total Sales</div>
          <div className="text-4xl font-bold">${totalSales.toFixed(2)}</div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Sales History</h2>
        {filteredSales.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No sales records</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Card Sales</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Cash Sales</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Total</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Variance</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Closed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {format(new Date(sale.date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-blue-600 text-right">
                      ${sale.card_sales.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-green-600 text-right">
                      ${sale.cash_sales.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                      ${sale.total_sales.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-right">
                      <span
                        className={
                          sale.variance === 0
                            ? 'text-gray-600'
                            : sale.variance > 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }
                      >
                        {sale.variance > 0 && '+'}${sale.variance.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{sale.users?.name || '—'}</td>
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

