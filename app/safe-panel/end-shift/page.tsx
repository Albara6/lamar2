'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { User } from '@/lib/auth'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default function EndShift() {
  const [user, setUser] = useState<User | null>(null)
  const [startingCash, setStartingCash] = useState('')
  const [endingCash, setEndingCash] = useState('')
  const [activeInput, setActiveInput] = useState<'starting' | 'ending'>('starting')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [shiftSummary, setShiftSummary] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const userStr = sessionStorage.getItem('safePanel_user')
    if (!userStr) {
      router.push('/safe-panel')
      return
    }
    setUser(JSON.parse(userStr))
  }, [router])

  const handleNumberClick = (num: string) => {
    if (activeInput === 'starting') {
      setStartingCash(startingCash + num)
    } else {
      setEndingCash(endingCash + num)
    }
  }

  const handleDecimal = () => {
    if (activeInput === 'starting' && !startingCash.includes('.') && startingCash.length > 0) {
      setStartingCash(startingCash + '.')
    } else if (activeInput === 'ending' && !endingCash.includes('.') && endingCash.length > 0) {
      setEndingCash(endingCash + '.')
    }
  }

  const handleClear = () => {
    if (activeInput === 'starting') {
      setStartingCash('')
    } else {
      setEndingCash('')
    }
  }

  const handleBackspace = () => {
    if (activeInput === 'starting') {
      setStartingCash(startingCash.slice(0, -1))
    } else {
      setEndingCash(endingCash.slice(0, -1))
    }
  }

  const handleSubmit = async () => {
    if (!user || !startingCash || !endingCash) {
      alert('Please enter both starting and ending drawer amounts')
      return
    }

    const starting = parseFloat(startingCash)
    const ending = parseFloat(endingCash)

    if (starting < 0 || ending < 0) {
      alert('Invalid amounts')
      return
    }

    setLoading(true)

    try {
      // Get today's drops and expenses for this user
      const today = format(new Date(), 'yyyy-MM-dd')
      
      const { data: drops } = await supabase
        .from('safe_drops')
        .select('amount')
        .eq('user_id', user.id)
        .gte('timestamp', `${today}T00:00:00`)
        .lt('timestamp', `${today}T23:59:59`)

      const { data: expenses } = await supabase
        .from('expenses')
        .select('amount')
        .eq('user_id', user.id)
        .eq('date', today)
        .eq('payment_type', 'cash')

      const totalDrops = drops?.reduce((sum: number, drop: any) => sum + drop.amount, 0) || 0
      const totalExpenses = expenses?.reduce((sum: number, expense: any) => sum + expense.amount, 0) || 0

      // Calculate expected ending drawer
      // Expected = Starting - Drops - Cash Expenses (if paid from drawer) or Starting - Drops
      const expectedEnding = starting - totalDrops
      const variance = ending - expectedEnding

      // Create shift record
      const { error } = await supabase
        .from('shifts')
        .insert([{
          user_id: user.id,
          starting_drawer_cash: starting,
          ending_drawer_cash: ending,
          total_drops: totalDrops,
          total_expenses: totalExpenses,
          variance: variance,
          notes: notes || null,
          end_time: new Date().toISOString(),
        }] as any)

      if (error) {
        console.error('Error creating shift record:', error)
        alert('Failed to record shift. Please try again.')
        return
      }

      setShiftSummary({
        starting,
        ending,
        totalDrops,
        totalExpenses,
        expectedEnding,
        variance,
      })
      setSuccess(true)
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (success && shiftSummary) {
    const isOver = shiftSummary.variance > 0
    const isShort = shiftSummary.variance < 0
    const isExact = shiftSummary.variance === 0

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center kiosk-mode">
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
            
            <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">Shift Completed</h2>
            <p className="text-gray-600 mb-6 text-center">
              {isExact && 'Perfect balance! Great job!'}
              {isOver && 'Drawer is over'}
              {isShort && 'Drawer is short'}
            </p>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Starting Drawer:</span>
                <span className="text-xl font-bold">${shiftSummary.starting.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Total Drops:</span>
                <span className="text-xl font-bold text-green-600">-${shiftSummary.totalDrops.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Cash Expenses:</span>
                <span className="text-xl font-bold text-red-600">${shiftSummary.totalExpenses.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
                <span className="text-blue-900 font-semibold">Expected Ending:</span>
                <span className="text-2xl font-bold text-blue-700">${shiftSummary.expectedEnding.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Actual Ending:</span>
                <span className="text-2xl font-bold">${shiftSummary.ending.toFixed(2)}</span>
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
                  {isOver && '+'}${Math.abs(shiftSummary.variance).toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={() => router.push('/safe-panel/home')}
              className="w-full btn-primary"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 kiosk-mode">
      <div className="bg-purple-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">End of Shift</h1>
            <p className="text-purple-100 mt-1">User: {user.name}</p>
          </div>
          <button
            onClick={() => router.push('/safe-panel/home')}
            className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50"
          >
            Cancel
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column - Amounts */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Drawer Reconciliation</h3>
              
              <div className="mb-6">
                <button
                  onClick={() => setActiveInput('starting')}
                  className={`w-full p-4 rounded-lg text-left ${
                    activeInput === 'starting' ? 'bg-purple-100 border-2 border-purple-500' : 'bg-gray-50'
                  }`}
                >
                  <div className="text-sm text-gray-600 mb-1">Starting Drawer Cash</div>
                  <div className="text-3xl font-bold text-purple-600">
                    ${startingCash || '0.00'}
                  </div>
                </button>
              </div>

              <div className="mb-6">
                <button
                  onClick={() => setActiveInput('ending')}
                  className={`w-full p-4 rounded-lg text-left ${
                    activeInput === 'ending' ? 'bg-purple-100 border-2 border-purple-500' : 'bg-gray-50'
                  }`}
                >
                  <div className="text-sm text-gray-600 mb-1">Ending Drawer Cash</div>
                  <div className="text-3xl font-bold text-purple-600">
                    ${endingCash || '0.00'}
                  </div>
                </button>
              </div>

              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                <strong>Note:</strong> Count all cash in your drawer. The system will automatically calculate expected amounts and variance.
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-field"
                rows={4}
                placeholder="Any notes about this shift..."
                disabled={loading}
              />
            </div>
          </div>

          {/* Right Column - Number Pad */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Enter {activeInput === 'starting' ? 'Starting' : 'Ending'} Amount
            </h3>
            
            <div className="grid grid-cols-3 gap-3 mb-4">
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
              className="w-full btn-secondary mb-4"
              disabled={loading}
            >
              Clear
            </button>

            <button
              onClick={handleSubmit}
              className="w-full btn-primary text-xl py-5"
              disabled={!startingCash || !endingCash || loading}
            >
              {loading ? 'Processing...' : 'Complete Shift'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

