'use client'

import { useState } from 'react'

export default function ClockKiosk() {
  const [unlocked, setUnlocked] = useState(false)
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [expense, setExpense] = useState({ amount: '', description: '' })
  const [keyManual, setKeyManual] = useState('')
  const [readingKey, setReadingKey] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const readFileAsText = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = () => reject(reader.error)
      try {
        reader.readAsText(file)
      } catch (e) {
        reject(e)
      }
    })

  const verifyKey = async (key: string) => {
    const res = await fetch('/api/kiosk/verify-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: key.trim() })
    })
    const data = await res.json()
    if (res.ok && data.success) {
      setUnlocked(true)
      setMessage('Kiosk unlocked')
      setError('')
    } else {
      setError(data.error || 'Invalid key')
    }
  }

  const handleKeyUpload = async (file: File) => {
    setReadingKey(true)
    setError('')
    setMessage('')
    try {
      // Try the modern API first
      let text = ''
      try {
        text = await (file as any).text?.()
      } catch {}
      if (!text) {
        text = await readFileAsText(file)
      }
      await verifyKey(text)
    } catch (e: any) {
      setError('Could not read the USB file. You can paste the code manually below.')
    } finally {
      setReadingKey(false)
    }
  }

  const handleVerifySelectedFile = async () => {
    if (!selectedFile) {
      setError('Select a USB key file first')
      return
    }
    await handleKeyUpload(selectedFile)
  }

  const handleManualUnlock = async () => {
    if (!keyManual.trim()) {
      setError('Enter the USB code')
      return
    }
    setReadingKey(true)
    setError('')
    await verifyKey(keyManual)
    setReadingKey(false)
  }

  const handleNumberClick = (num: string) => {
    if (pin.length < 4) {
      setPin(pin + num)
      setError('')
    }
  }
  const handleClear = () => { setPin(''); setError(''); setMessage('') }

  const submitAction = async (action: 'clock-in' | 'clock-out' | 'log-expense') => {
    if (!unlocked) { setError('Kiosk locked'); return }
    if (pin.length !== 4) { setError('Enter 4-digit code'); return }
    setLoading(true)
    setError('')
    setMessage('')
    try {
      let res: Response
      if (action === 'log-expense') {
        const amt = parseFloat(expense.amount)
        if (!amt || amt <= 0 || !expense.description) {
          setError('Enter amount and description')
          setLoading(false)
          return
        }
        res = await fetch('/api/employees/expenses/log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: pin, amount: amt, description: expense.description }) })
      } else {
        res = await fetch(`/api/employees/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: pin }) })
      }
      const data = await res.json()
      if (res.ok) {
        setMessage(action === 'clock-in' ? 'Clocked in' : action === 'clock-out' ? 'Clocked out' : 'Expense logged')
        setPin('')
        setExpense({ amount: '', description: '' })
      } else {
        setError(data.error || 'Failed')
      }
    } catch (e: any) {
      setError(e.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center kiosk-mode p-6">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-8">
        <h1 className="text-3xl font-bold mb-4">Clock In/Out Kiosk</h1>

        {!unlocked && (
          <div className="mb-6">
            <p className="mb-2">Insert your USB key and select the key file to unlock:</p>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept=".txt,.key,.json,text/plain,application/json"
                onChange={(e) => setSelectedFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
                disabled={readingKey}
              />
              <button onClick={handleVerifySelectedFile} className="btn-primary px-4 py-2" disabled={readingKey}>Verify file</button>
            </div>
            {readingKey && <p className="text-sm text-gray-600 mt-2">Verifying…</p>}
            <div className="mt-4 p-3 bg-gray-50 rounded border">
              <p className="text-sm text-gray-700 mb-2">Or paste the code from the USB file:</p>
              <div className="flex gap-2">
                <input className="border p-2 rounded flex-1" value={keyManual} onChange={e=>setKeyManual(e.target.value)} placeholder="Paste code here" />
                <button onClick={handleManualUnlock} className="btn-primary px-4" disabled={readingKey}>Unlock</button>
              </div>
            </div>
          </div>
        )}

        {unlocked && (
          <>
            <div className="mb-6">
              <div className="flex justify-center gap-4 mb-4">
                {[0,1,2,3].map(i => (
                  <div key={i} className={`w-16 h-16 rounded-full border-4 flex items-center justify-center text-2xl font-bold ${pin.length>i?'bg-primary-600 border-primary-600 text-white':'bg-gray-100 border-gray-300 text-transparent'}`}>{pin.length>i?'•':'0'}</div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {['1','2','3','4','5','6','7','8','9'].map(num => (
                  <button key={num} onClick={() => handleNumberClick(num)} className="touch-button bg-gray-100 hover:bg-gray-200 text-gray-800 h-20 text-3xl" disabled={loading}>{num}</button>
                ))}
                <button onClick={handleClear} className="touch-button bg-red-100 hover:bg-red-200 text-red-700 h-20 text-xl" disabled={loading}>Clear</button>
                <button onClick={() => handleNumberClick('0')} className="touch-button bg-gray-100 hover:bg-gray-200 text-gray-800 h-20 text-3xl" disabled={loading}>0</button>
                <div />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <button onClick={() => submitAction('clock-in')} className="touch-button h-16 bg-green-600 hover:bg-green-700 text-white" disabled={loading}>Clock In</button>
              <button onClick={() => submitAction('clock-out')} className="touch-button h-16 bg-yellow-600 hover:bg-yellow-700 text-white" disabled={loading}>Clock Out</button>
              <button onClick={() => submitAction('log-expense')} className="touch-button h-16 bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>Log Expense</button>
            </div>

            <div className="bg-gray-50 rounded p-4 border">
              <div className="grid grid-cols-2 gap-4">
                <input className="border p-3 rounded" placeholder="Expense amount" value={expense.amount} onChange={e=>setExpense({ ...expense, amount: e.target.value })} />
                <input className="border p-3 rounded" placeholder="Expense description" value={expense.description} onChange={e=>setExpense({ ...expense, description: e.target.value })} />
              </div>
            </div>
          </>
        )}

        {message && <p className="mt-4 text-green-700">{message}</p>}
        {error && <p className="mt-4 text-red-700">{error}</p>}
      </div>
    </div>
  )
}
