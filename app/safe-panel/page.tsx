'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { verifyPin } from '@/lib/auth'
import type { User } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default function SafePanelLogin() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleNumberClick = (num: string) => {
    if (pin.length < 6) {
      setPin(pin + num)
      setError('')
    }
  }

  const handleClear = () => {
    setPin('')
    setError('')
  }

  const handleSubmit = async () => {
    if (pin.length !== 6) {
      setError('Please enter a 6-digit PIN')
      return
    }

    setLoading(true)
    setError('')

    try {
      const user = await verifyPin(pin)
      
      if (user) {
        // Store user in session storage
        sessionStorage.setItem('safePanel_user', JSON.stringify(user))
        router.push('/safe-panel/home')
      } else {
        setError('Invalid PIN. Please try again.')
        setPin('')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center kiosk-mode">
      <div className="max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
            <svg className="w-12 h-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Safe Panel</h1>
          <p className="text-primary-100 text-lg">Enter your 6-digit PIN</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* PIN Display */}
          <div className="mb-8">
            <div className="flex justify-center gap-4 mb-4">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`w-16 h-16 rounded-full border-4 flex items-center justify-center text-2xl font-bold ${
                    pin.length > i
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : 'bg-gray-100 border-gray-300 text-transparent'
                  }`}
                >
                  {pin.length > i ? '•' : '0'}
                </div>
              ))}
            </div>
            {error && (
              <p className="text-red-600 text-center text-sm font-medium">{error}</p>
            )}
          </div>

          {/* Number Pad */}
          <div className="grid grid-cols-3 gap-4 mb-4">
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
              onClick={handleClear}
              className="touch-button bg-red-100 hover:bg-red-200 text-red-700 h-20 text-xl"
              disabled={loading}
            >
              Clear
            </button>
            <button
              onClick={() => handleNumberClick('0')}
              className="touch-button bg-gray-100 hover:bg-gray-200 text-gray-800 h-20 text-3xl"
              disabled={loading}
            >
              0
            </button>
            <button
              onClick={handleSubmit}
              className={`touch-button h-20 text-xl ${
                pin.length === 6 && !loading
                  ? 'bg-primary-600 hover:bg-primary-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              disabled={pin.length !== 6 || loading}
            >
              {loading ? 'Verifying...' : 'Enter'}
            </button>
          </div>
        </div>

        <div className="text-center mt-6">
          <button
            onClick={() => router.push('/')}
            className="text-white hover:text-primary-100 text-lg"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}

