'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { calculateExpectedSafeBalance } from '@/lib/calculations'
import type { User } from '@/lib/auth'

export default function ManualSafeCount() {
  const [user, setUser] = useState<User | null>(null)
  const [actualAmount, setActualAmount] = useState('')
  const [expectedAmount, setExpectedAmount] = useState<number>(0)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingExpected, setLoadingExpected] = useState(true)
  const [success, setSuccess] = useState(false)
  const [variance, setVariance] = useState<number>(0)
  const router = useRouter()

  useEffect(() => {
    const userStr = sessionStorage.getItem('safePanel_user')
    if (!userStr) {
      router.push('/safe-panel')
      return
    }
    const userData = JSON.parse(userStr)
    
    // Check if user is manager or admin
    if (userData.role !== 'manager' && userData.role !== 'admin') {
      alert('Access denied. Manager role required.')
      router.push('/safe-panel/home')
      return
    }
    
    setUser(userData)
    loadExpectedBalance()
  }, [router])

  const loadExpectedBalance = async () => {
    setLoadingExpected(true)
    try {
      const expected = await calculateExpectedSafeBalance()
      setExpectedAmount(expected)
    } catch (error) {
      console.error('Error loading expected balance:', error)
    } finally {
      setLoadingExpected(false)
    }
  }

  const handleNumberClick = (num: string) => {
    setActualAmount(actualAmount + num)
  }

  const handleDecimal = () => {
    if (!actualAmount.includes('.') && actualAmount.length > 0) {
      setActualAmount(actualAmount + '.')
    }
  }

  const handleClear = () => {
    setActualAmount('')
  }

  const handleBackspace = () => {
    setActualAmount(actualAmount.slice(0, -1))
  }

  const handleSubmit = async () => {
    if (!user || !actualAmount) {
      alert('Please enter the actual safe amount')
      return
    }

    const actual = parseFloat(actualAmount)
    if (actual < 0) {
      alert('Invalid amount')
      return
    }

    const calculatedVariance = actual - expectedAmount

    setLoading(true)

    try {
      const { error } = await supabase
        .from('manual_safe_counts')
        .insert([{
          user_id: user.id,
          expected_amount: expectedAmount,
          actual_amount: actual,
          notes: notes || null,
        }] as any)

      if (error) {
        console.error('Error recording safe count:', error)
        alert('Failed to record safe count. Please try again.')
        return
      }

      setVariance(calculatedVariance)
      setSuccess(true)
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleNewCount = () => {
    setActualAmount('')
    setNotes('')
    setSuccess(false)
    setVariance(0)
    loadExpectedBalance()
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (success) {
    const isOver = variance > 0
    const isShort = variance < 0
    const isExact = variance === 0

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center kiosk-mode">
        <div className="max-w-2xl w-full mx-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
              isExact ? 'bg-green-500' : isOver ? 'bg-yellow-500' : 'bg-red-500'
            }`}>
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isExact ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                )}
              </svg>
            </div>
            
            <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">Safe Count Recorded</h2>
            <p className="text-gray-600 mb-6 text-center">
              {isExact && 'Perfect match! Safe balance is correct.'}
              {isOver && 'Safe has more cash than expected'}
              {isShort && 'Safe has less cash than expected'}
            </p>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Expected Amount:</span>
                <span className="text-2xl font-bold">${expectedAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Actual Count:</span>
                <span className="text-2xl font-bold">${parseFloat(actualAmount).toFixed(2)}</span>
              </div>
              <div className={`flex justify-between items-center p-4 rounded-lg border-2 ${
                isExact ? 'bg-green-50 border-green-300' : 
                isOver ? 'bg-yellow-50 border-yellow-300' : 
                'bg-red-50 border-red-300'
              }`}>
                <span className={`font-semibold ${
                  isExact ? 'text-green-900' : isOver ? 'text-yellow-900' : 'text-red-900'
                }`}>
                  Variance:
                </span>
                <span className={`text-3xl font-bold ${
                  isExact ? 'text-green-700' : isOver ? 'text-yellow-700' : 'text-red-700'
                }`}>
                  {isOver && '+'}${Math.abs(variance).toFixed(2)}
                </span>
              </div>
            </div>

            {!isExact && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <p className="text-sm text-yellow-700">
                  <strong>Note:</strong> A variance has been logged. Please investigate the discrepancy.
                </p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={handleNewCount}
                className="flex-1 btn-primary"
              >
                New Count
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
      <div className="bg-indigo-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Manual Safe Count</h1>
            <p className="text-indigo-100 mt-1">Manager: {user.name}</p>
          </div>
          <button
            onClick={() => router.push('/safe-panel/home')}
            className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-indigo-50"
          >
            Cancel
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Expected Balance */}
          <div className="mb-8 p-6 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-xl">
            <div className="text-sm font-medium text-gray-700 mb-2">Expected Safe Balance</div>
            <div className="text-5xl font-bold text-indigo-700">
              {loadingExpected ? 'Loading...' : `$${expectedAmount.toFixed(2)}`}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Based on all drops minus withdrawals
            </p>
          </div>

          {/* Actual Amount Display */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Actual Safe Count
            </label>
            <div className="text-6xl font-bold text-indigo-600 text-center py-8 bg-gray-50 rounded-xl">
              ${actualAmount || '0.00'}
            </div>
            <p className="text-sm text-gray-600 mt-2 text-center">
              Count all cash physically in the safe
            </p>
          </div>

          {/* Number Pad */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                onClick={() => handleNumberClick(num)}
                className="touch-button bg-gray-100 hover:bg-gray-200 text-gray-800 h-20 text-3xl"
                disabled={loading}
              >
                {num}
              </button>
            ))}
            <button
              onClick={handleDecimal}
              className="touch-button bg-gray-100 hover:bg-gray-200 text-gray-800 h-20 text-3xl"
              disabled={loading}
            >
              .
            </button>
            <button
              onClick={() => handleNumberClick('0')}
              className="touch-button bg-gray-100 hover:bg-gray-200 text-gray-800 h-20 text-3xl"
              disabled={loading}
            >
              0
            </button>
            <button
              onClick={handleBackspace}
              className="touch-button bg-red-100 hover:bg-red-200 text-red-700 h-20 text-xl"
              disabled={loading}
            >
              ⌫
            </button>
          </div>

          <button
            onClick={handleClear}
            className="w-full btn-secondary mb-6"
            disabled={loading}
          >
            Clear
          </button>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field"
              rows={3}
              placeholder="Any notes about this count..."
              disabled={loading}
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            className="w-full btn-primary text-2xl py-6"
            disabled={!actualAmount || parseFloat(actualAmount) < 0 || loading || loadingExpected}
          >
            {loading ? 'Recording...' : 'Record Safe Count'}
          </button>
        </div>
      </div>
    </div>
  )
}

