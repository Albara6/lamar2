'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { calculateSafeBalance, generateWithdrawalNumber } from '@/lib/calculations'
import type { User } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default function ManagerWithdrawal() {
  const [user, setUser] = useState<User | null>(null)
  const [amount, setAmount] = useState('')
  const [withdrawAll, setWithdrawAll] = useState(false)
  const [safeBalance, setSafeBalance] = useState<number>(0)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingBalance, setLoadingBalance] = useState(true)
  const [success, setSuccess] = useState(false)
  const [withdrawalId, setWithdrawalId] = useState('')
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
    loadSafeBalance()
  }, [router])

  const loadSafeBalance = async () => {
    setLoadingBalance(true)
    try {
      const balance = await calculateSafeBalance()
      setSafeBalance(balance)
    } catch (error) {
      console.error('Error loading safe balance:', error)
    } finally {
      setLoadingBalance(false)
    }
  }

  const handleNumberClick = (num: string) => {
    if (!withdrawAll) {
      setAmount(amount + num)
    }
  }

  const handleDecimal = () => {
    if (!withdrawAll && !amount.includes('.') && amount.length > 0) {
      setAmount(amount + '.')
    }
  }

  const handleClear = () => {
    setAmount('')
  }

  const handleBackspace = () => {
    setAmount(amount.slice(0, -1))
  }

  const handleWithdrawAll = () => {
    setWithdrawAll(true)
    setAmount(safeBalance.toFixed(2))
  }

  const handleSubmit = async () => {
    if (!user || !reason.trim()) {
      alert('Please provide a reason for the withdrawal')
      return
    }

    const withdrawAmount = parseFloat(amount)
    if (!withdrawAmount || withdrawAmount <= 0) {
      alert('Please enter a valid amount')
      return
    }

    if (withdrawAmount > safeBalance) {
      alert(`Withdrawal amount exceeds safe balance ($${safeBalance.toFixed(2)})`)
      return
    }

    setLoading(true)

    try {
      const wdNumber = generateWithdrawalNumber()
      
      const { error } = await supabase
        .from('withdrawals')
        .insert([{
          user_id: user.id,
          amount: withdrawAmount,
          reason: reason,
          approved_by: user.id,
        }] as any)

      if (error) {
        console.error('Error recording withdrawal:', error)
        alert('Failed to record withdrawal. Please try again.')
        return
      }

      setWithdrawalId(wdNumber)
      setSuccess(true)
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Withdrawal Receipt</title>
            <style>
              body { font-family: monospace; padding: 20px; }
              .center { text-align: center; }
              .bold { font-weight: bold; }
              .line { border-top: 1px dashed #000; margin: 10px 0; }
            </style>
          </head>
          <body>
            <div class="center bold">MANAGER WITHDRAWAL</div>
            <div class="line"></div>
            <div>Withdrawal #: ${withdrawalId}</div>
            <div>Amount: $${parseFloat(amount).toFixed(2)}</div>
            <div>Manager: ${user?.name}</div>
            <div>Date: ${new Date().toLocaleString()}</div>
            <div>Reason: ${reason}</div>
            <div class="line"></div>
            <div class="center">Authorized Withdrawal</div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const handleNewWithdrawal = () => {
    setAmount('')
    setReason('')
    setWithdrawAll(false)
    setSuccess(false)
    setWithdrawalId('')
    loadSafeBalance()
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center kiosk-mode">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-24 h-24 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Withdrawal Approved!</h2>
            <p className="text-gray-600 mb-6">The withdrawal has been recorded successfully.</p>
            
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="text-sm text-gray-600 mb-1">Withdrawal ID</div>
              <div className="text-xl font-bold text-gray-800 mb-4 font-mono">{withdrawalId}</div>
              <div className="text-sm text-gray-600 mb-1">Amount</div>
              <div className="text-4xl font-bold text-yellow-600">${parseFloat(amount).toFixed(2)}</div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handlePrint}
                className="flex-1 btn-secondary"
              >
                Print Slip
              </button>
              <button
                onClick={handleNewWithdrawal}
                className="flex-1 btn-primary"
              >
                New Withdrawal
              </button>
            </div>
            
            <button
              onClick={() => router.push('/safe-panel/home')}
              className="mt-4 text-gray-600 hover:text-gray-800"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 kiosk-mode">
      <div className="bg-yellow-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Manager Withdrawal</h1>
            <p className="text-yellow-100 mt-1">Manager: {user.name}</p>
          </div>
          <button
            onClick={() => router.push('/safe-panel/home')}
            className="bg-white text-yellow-600 px-6 py-3 rounded-lg font-semibold hover:bg-yellow-50"
          >
            Cancel
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Safe Balance */}
          <div className="mb-8 p-6 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl">
            <div className="text-sm font-medium text-gray-700 mb-2">Current Safe Balance</div>
            <div className="text-5xl font-bold text-yellow-700">
              {loadingBalance ? 'Loading...' : `$${safeBalance.toFixed(2)}`}
            </div>
          </div>

          {/* Withdraw All Button */}
          <div className="mb-6">
            <button
              onClick={handleWithdrawAll}
              className="w-full bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-semibold py-4 px-6 rounded-lg"
              disabled={loading || loadingBalance}
            >
              Withdraw All (${safeBalance.toFixed(2)})
            </button>
          </div>

          {/* Amount Display */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Withdrawal Amount</label>
            <div className="text-6xl font-bold text-yellow-600 text-center py-8 bg-gray-50 rounded-xl">
              ${amount || '0.00'}
            </div>
          </div>

          {/* Number Pad */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                onClick={() => handleNumberClick(num)}
                className="touch-button bg-gray-100 hover:bg-gray-200 text-gray-800 h-20 text-3xl"
                disabled={loading || withdrawAll}
              >
                {num}
              </button>
            ))}
            <button
              onClick={handleDecimal}
              className="touch-button bg-gray-100 hover:bg-gray-200 text-gray-800 h-20 text-3xl"
              disabled={loading || withdrawAll}
            >
              .
            </button>
            <button
              onClick={() => handleNumberClick('0')}
              className="touch-button bg-gray-100 hover:bg-gray-200 text-gray-800 h-20 text-3xl"
              disabled={loading || withdrawAll}
            >
              0
            </button>
            <button
              onClick={handleBackspace}
              className="touch-button bg-red-100 hover:bg-red-200 text-red-700 h-20 text-xl"
              disabled={loading || withdrawAll}
            >
              ⌫
            </button>
          </div>

          <div className="flex gap-4 mb-6">
            <button
              onClick={handleClear}
              className="flex-1 btn-secondary"
              disabled={loading}
            >
              Clear
            </button>
            {withdrawAll && (
              <button
                onClick={() => {
                  setWithdrawAll(false)
                  setAmount('')
                }}
                className="flex-1 btn-secondary"
              >
                Custom Amount
              </button>
            )}
          </div>

          {/* Reason */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Withdrawal *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="input-field"
              rows={3}
              placeholder="Enter reason for this withdrawal..."
              disabled={loading}
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            className="w-full btn-primary text-2xl py-6"
            disabled={!amount || parseFloat(amount) <= 0 || !reason.trim() || loading}
          >
            {loading ? 'Processing...' : 'Authorize Withdrawal'}
          </button>
        </div>
      </div>
    </div>
  )
}

