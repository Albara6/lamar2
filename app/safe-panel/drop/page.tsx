'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { generateReceiptNumber } from '@/lib/calculations'
import type { User } from '@/lib/auth'

export default function SafeDrop() {
  const [user, setUser] = useState<User | null>(null)
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [receiptNumber, setReceiptNumber] = useState('')
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
    setAmount(amount + num)
  }

  const handleDecimal = () => {
    if (!amount.includes('.') && amount.length > 0) {
      setAmount(amount + '.')
    }
  }

  const handleClear = () => {
    setAmount('')
  }

  const handleBackspace = () => {
    setAmount(amount.slice(0, -1))
  }

  const handleSubmit = async () => {
    if (!user || !amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount')
      return
    }

    setLoading(true)

    try {
      const receipt = generateReceiptNumber()
      
      const { error } = await supabase
        .from('safe_drops')
        .insert([{
          user_id: user.id,
          amount: parseFloat(amount),
          receipt_number: receipt,
          confirmed: true,
          notes: notes || null,
        }] as any)

      if (error) {
        console.error('Error recording drop:', error)
        alert('Failed to record drop. Please try again.')
        return
      }

      setReceiptNumber(receipt)
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
            <title>Safe Drop Receipt</title>
            <style>
              body { font-family: monospace; padding: 20px; }
              .center { text-align: center; }
              .bold { font-weight: bold; }
              .line { border-top: 1px dashed #000; margin: 10px 0; }
            </style>
          </head>
          <body>
            <div class="center bold">SAFE DROP RECEIPT</div>
            <div class="line"></div>
            <div>Receipt #: ${receiptNumber}</div>
            <div>Amount: $${parseFloat(amount).toFixed(2)}</div>
            <div>User: ${user?.name}</div>
            <div>Date: ${new Date().toLocaleString()}</div>
            ${notes ? `<div>Notes: ${notes}</div>` : ''}
            <div class="line"></div>
            <div class="center">Thank you!</div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const handleNewDrop = () => {
    setAmount('')
    setNotes('')
    setSuccess(false)
    setReceiptNumber('')
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
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Drop Recorded!</h2>
            <p className="text-gray-600 mb-6">Your safe drop has been successfully recorded.</p>
            
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="text-sm text-gray-600 mb-1">Receipt Number</div>
              <div className="text-2xl font-bold text-gray-800 mb-4 font-mono">{receiptNumber}</div>
              <div className="text-sm text-gray-600 mb-1">Amount</div>
              <div className="text-4xl font-bold text-green-600">${parseFloat(amount).toFixed(2)}</div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handlePrint}
                className="flex-1 btn-secondary"
              >
                Print Receipt
              </button>
              <button
                onClick={handleNewDrop}
                className="flex-1 btn-primary"
              >
                New Drop
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
      <div className="bg-green-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Make Safe Drop</h1>
            <p className="text-green-100 mt-1">Recording as: {user.name}</p>
          </div>
          <button
            onClick={() => router.push('/safe-panel/home')}
            className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50"
          >
            Cancel
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Amount Display */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">Drop Amount</label>
            <div className="text-6xl font-bold text-green-600 text-center py-8 bg-gray-50 rounded-xl">
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

          <div className="flex gap-4 mb-6">
            <button
              onClick={handleClear}
              className="flex-1 btn-secondary"
              disabled={loading}
            >
              Clear
            </button>
          </div>

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
              placeholder="Add any notes about this drop..."
              disabled={loading}
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            className="w-full btn-primary text-2xl py-6"
            disabled={!amount || parseFloat(amount) <= 0 || loading}
          >
            {loading ? 'Recording...' : 'Record Drop'}
          </button>
        </div>
      </div>
    </div>
  )
}

