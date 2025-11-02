'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { calculateCashSalesForDate } from '@/lib/calculations'
import type { User } from '@/lib/auth'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default function RecordSales() {
  const [user, setUser] = useState<User | null>(null)
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [cardSales, setCardSales] = useState('')
  const [cashSales, setCashSales] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const userStr = sessionStorage.getItem('safePanel_user')
    if (!userStr) {
      router.push('/safe-panel')
      return
    }
    setUser(JSON.parse(userStr))
  }, [router])

  const handleCalculateCashSales = async () => {
    setCalculating(true)
    try {
      const res = await fetch('/api/sales/cash?date=' + encodeURIComponent(date))
      const json = await res.json()
      if (res.ok) setCashSales(json.cashSales)
    } catch (error) {
      console.error('Error calculating cash sales:', error)
      alert('Failed to calculate cash sales')
    } finally {
      setCalculating(false)
    }
  }

  const handleNumberClick = (num: string) => {
    setCardSales(cardSales + num)
    setCashSales(null) // Reset cash sales when card sales changes
  }

  const handleDecimal = () => {
    if (!cardSales.includes('.') && cardSales.length > 0) {
      setCardSales(cardSales + '.')
    }
  }

  const handleClear = () => {
    setCardSales('')
    setCashSales(null)
  }

  const handleBackspace = () => {
    setCardSales(cardSales.slice(0, -1))
    setCashSales(null)
  }

  const handleSubmit = async () => {
    if (!user || !cardSales || parseFloat(cardSales) < 0) {
      alert('Please enter card sales amount')
      return
    }

    if (cashSales === null) {
      alert('Please calculate cash sales first')
      return
    }

    setLoading(true)

    try {
      const cardAmount = parseFloat(cardSales)
      const totalSales = cardAmount + cashSales

      // Check if sales already exist for this date
      const { data: existing } = await supabase
        .from('daily_sales')
        .select('id')
        .eq('date', date)
        .single()

      let error

      if (existing) {
        // Update existing record
        const result = await (supabase as any)
          .from('daily_sales')
          .update({
            card_sales: cardAmount,
            cash_sales: cashSales,
            closed_by_user_id: user.id,
            notes: notes || null,
          })
          .eq('id', (existing as any).id)
        error = result.error
      } else {
        // Insert new record
        const result = await supabase
          .from('daily_sales')
          .insert([{
            date: date,
            card_sales: cardAmount,
            cash_sales: cashSales,
            closed_by_user_id: user.id,
            notes: notes || null,
          }] as any)
        error = result.error
      }

      if (error) {
        console.error('Error recording sales:', error)
        alert('Failed to record sales. Please try again.')
        return
      }

      setSuccess(true)
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleNewEntry = () => {
    setCardSales('')
    setCashSales(null)
    setNotes('')
    setDate(format(new Date(), 'yyyy-MM-dd'))
    setSuccess(false)
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center kiosk-mode">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Sales Recorded!</h2>
            <p className="text-gray-600 mb-6">Daily sales have been successfully saved.</p>
            
            <div className="bg-gray-50 rounded-lg p-6 mb-6 space-y-3">
              <div>
                <div className="text-sm text-gray-600">Card Sales</div>
                <div className="text-2xl font-bold text-blue-600">${parseFloat(cardSales).toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Cash Sales</div>
                <div className="text-2xl font-bold text-green-600">${cashSales?.toFixed(2)}</div>
              </div>
              <div className="border-t pt-3">
                <div className="text-sm text-gray-600">Total Sales</div>
                <div className="text-3xl font-bold text-gray-800">
                  ${(parseFloat(cardSales) + (cashSales || 0)).toFixed(2)}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleNewEntry}
                className="flex-1 btn-primary"
              >
                New Entry
              </button>
              <button
                onClick={() => router.push('/safe-panel/home')}
                className="flex-1 btn-secondary"
              >
                Home
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 kiosk-mode">
      <div className="bg-blue-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Record Daily Sales</h1>
            <p className="text-blue-100 mt-1">Recording as: {user.name}</p>
          </div>
          <button
            onClick={() => router.push('/safe-panel/home')}
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50"
          >
            Cancel
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column - Info */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Sales Information</h3>
            
            {/* Date */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input-field"
                disabled={loading}
              />
            </div>

            {/* Cash Sales Calculation */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Cash Sales Calculation</h4>
              <p className="text-sm text-blue-700 mb-3">
                Cash sales = Total safe drops + Cash expenses for this date
              </p>
              {cashSales !== null ? (
                <div className="text-3xl font-bold text-blue-600">
                  ${cashSales.toFixed(2)}
                </div>
              ) : (
                <button
                  onClick={handleCalculateCashSales}
                  className="btn-primary w-full"
                  disabled={calculating}
                >
                  {calculating ? 'Calculating...' : 'Calculate Cash Sales'}
                </button>
              )}
            </div>

            {/* Total Sales */}
            {cashSales !== null && cardSales && (
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Total Sales</h4>
                <div className="text-4xl font-bold text-green-600">
                  ${(parseFloat(cardSales) + cashSales).toFixed(2)}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-field"
                rows={3}
                placeholder="Optional notes..."
                disabled={loading}
              />
            </div>
          </div>

          {/* Right Column - Card Sales Entry */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Card Sales Amount</h3>
            
            <div className="text-5xl font-bold text-blue-600 text-center py-6 bg-gray-50 rounded-xl mb-4">
              ${cardSales || '0.00'}
            </div>

            {/* Number Pad */}
            <div className="grid grid-cols-3 gap-3">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  onClick={() => handleNumberClick(num)}
                  className="touch-button bg-gray-100 hover:bg-gray-200 text-gray-800 h-16 text-2xl"
                  disabled={loading}
                >
                  {num}
                </button>
              ))}
              <button
                onClick={handleDecimal}
                className="touch-button bg-gray-100 hover:bg-gray-200 text-gray-800 h-16 text-2xl"
                disabled={loading}
              >
                .
              </button>
              <button
                onClick={() => handleNumberClick('0')}
                className="touch-button bg-gray-100 hover:bg-gray-200 text-gray-800 h-16 text-2xl"
                disabled={loading}
              >
                0
              </button>
              <button
                onClick={handleBackspace}
                className="touch-button bg-red-100 hover:bg-red-200 text-red-700 h-16 text-xl"
                disabled={loading}
              >
                ⌫
              </button>
            </div>

            <button
              onClick={handleClear}
              className="w-full btn-secondary mt-3"
              disabled={loading}
            >
              Clear
            </button>

            <button
              onClick={handleSubmit}
              className="w-full btn-primary mt-4 text-xl py-5"
              disabled={!cardSales || parseFloat(cardSales) < 0 || cashSales === null || loading}
            >
              {loading ? 'Recording...' : 'Record Sales'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

