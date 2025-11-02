'use client'

import { useEffect, useState } from 'react'
import { calculateBankVariance } from '@/lib/calculations'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns'

export const dynamic = 'force-dynamic'

export default function Reconciliation() {
  const [period, setPeriod] = useState<'week' | 'month' | 'custom'>('month')
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))
  const [variance, setVariance] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    updateDates(period)
  }, [period])

  const updateDates = (newPeriod: 'week' | 'month' | 'custom') => {
    const now = new Date()
    if (newPeriod === 'week') {
      setStartDate(format(startOfWeek(now), 'yyyy-MM-dd'))
      setEndDate(format(endOfWeek(now), 'yyyy-MM-dd'))
    } else if (newPeriod === 'month') {
      setStartDate(format(startOfMonth(now), 'yyyy-MM-dd'))
      setEndDate(format(endOfMonth(now), 'yyyy-MM-dd'))
    }
  }

  const handleCalculate = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ start: startDate, end: endDate })
      const res = await fetch('/api/reconciliation?' + params.toString())
      const result = await res.json()
      setVariance(result)
    } catch (error) {
      console.error('Error calculating variance:', error)
      alert('Failed to calculate variance')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Bank Reconciliation</h1>
        <p className="text-gray-600 mt-1">Compare expected vs actual bank deposits</p>
      </div>

      {/* Period Selection */}
      <div className="card mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Select Period</h2>
        
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => {
              setPeriod('week')
              updateDates('week')
            }}
            className={`px-4 py-2 rounded-lg ${
              period === 'week' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => {
              setPeriod('month')
              updateDates('month')
            }}
            className={`px-4 py-2 rounded-lg ${
              period === 'month' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setPeriod('custom')}
            className={`px-4 py-2 rounded-lg ${
              period === 'custom' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Custom Range
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-field"
              disabled={period !== 'custom'}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-field"
              disabled={period !== 'custom'}
            />
          </div>
        </div>

        <button
          onClick={handleCalculate}
          className="btn-primary"
          disabled={loading}
        >
          {loading ? 'Calculating...' : 'Calculate Variance'}
        </button>
      </div>

      {/* Results */}
      {variance && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Reconciliation Results</h2>
          
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
              <div>
                <div className="text-sm text-blue-700 mb-1">Expected Deposits</div>
                <div className="text-xs text-blue-600">Card sales + Check expenses</div>
              </div>
              <div className="text-3xl font-bold text-blue-700">
                ${variance.expectedDeposits.toFixed(2)}
              </div>
            </div>

            <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
              <div>
                <div className="text-sm text-purple-700 mb-1">Actual Deposits</div>
                <div className="text-xs text-purple-600">Total deposits logged</div>
              </div>
              <div className="text-3xl font-bold text-purple-700">
                ${variance.actualDeposits.toFixed(2)}
              </div>
            </div>

            <div
              className={`flex justify-between items-center p-6 rounded-lg border-2 ${
                variance.variance === 0
                  ? 'bg-green-50 border-green-300'
                  : variance.variance > 0
                  ? 'bg-yellow-50 border-yellow-300'
                  : 'bg-red-50 border-red-300'
              }`}
            >
              <div>
                <div
                  className={`text-lg font-semibold mb-1 ${
                    variance.variance === 0
                      ? 'text-green-900'
                      : variance.variance > 0
                      ? 'text-yellow-900'
                      : 'text-red-900'
                  }`}
                >
                  Bank Variance
                </div>
                <div
                  className={`text-sm ${
                    variance.variance === 0
                      ? 'text-green-700'
                      : variance.variance > 0
                      ? 'text-yellow-700'
                      : 'text-red-700'
                  }`}
                >
                  {variance.variance === 0
                    ? 'Perfect match!'
                    : variance.variance > 0
                    ? 'More deposited than expected'
                    : 'Less deposited than expected'}
                </div>
              </div>
              <div
                className={`text-5xl font-bold ${
                  variance.variance === 0
                    ? 'text-green-700'
                    : variance.variance > 0
                    ? 'text-yellow-700'
                    : 'text-red-700'
                }`}
              >
                {variance.variance > 0 && '+'}${Math.abs(variance.variance).toFixed(2)}
              </div>
            </div>
          </div>

          {variance.variance !== 0 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <p className="text-sm text-yellow-700">
                <strong>Action Required:</strong> Please investigate the variance. Check for:
              </p>
              <ul className="list-disc list-inside text-sm text-yellow-700 mt-2 space-y-1">
                <li>Missing deposit records in the system</li>
                <li>Unrecorded card sales or check expenses</li>
                <li>Bank fees or charges</li>
                <li>Pending deposits not yet cleared</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Information Card */}
      <div className="card mt-6">
        <h3 className="text-lg font-bold text-gray-900 mb-3">How Reconciliation Works</h3>
        <div className="text-sm text-gray-600 space-y-2">
          <p>
            <strong>Expected Deposits:</strong> Sum of all card sales and check expenses for the period.
            These amounts should be deposited into the bank.
          </p>
          <p>
            <strong>Actual Deposits:</strong> Sum of all deposits logged in the system for the period.
          </p>
          <p>
            <strong>Variance:</strong> Difference between actual and expected. A positive variance means
            more was deposited than expected. A negative variance means less was deposited.
          </p>
        </div>
      </div>
    </div>
  )
}

