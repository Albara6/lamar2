'use client'

import { useState, useEffect } from 'react'

export default function TeamPortal() {
  const [code, setCode] = useState('')
  const [employee, setEmployee] = useState<any>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [entries, setEntries] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])

  const handleNumberClick = (num: string) => {
    if (employee) return
    if (code.length < 4) { setCode(code + num); setError('') }
  }
  const handleClear = () => { if (!employee) { setCode(''); setError('') } }

  const login = async () => {
    if (code.length !== 4) { setError('Enter 4-digit code'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/employees/verify-code', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) })
      const data = await res.json()
      if (res.ok) {
        setEmployee(data.employee)
      } else {
        setError(data.error || 'Invalid code')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const run = async () => {
      if (!employee) return
      const params = new URLSearchParams({ employee_id: employee.id })
      const [entriesRes, expensesRes] = await Promise.all([
        fetch(`/api/team/entries?${params.toString()}`),
        fetch(`/api/team/expenses?${params.toString()}`)
      ])
      const [entriesData, expensesData] = await Promise.all([entriesRes.json(), expensesRes.json()])
      if (entriesRes.ok) setEntries(entriesData.entries || [])
      if (expensesRes.ok) setExpenses(expensesData.expenses || [])
    }
    run()
  }, [employee])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-8">
        {!employee ? (
          <div>
            <h1 className="text-3xl font-bold mb-6">Team Portal</h1>
            <p className="text-gray-600 mb-4">Enter your 4-digit code to view your hours and expenses.</p>
            <div className="flex justify-center gap-4 mb-4">
              {[0,1,2,3].map(i => (
                <div key={i} className={`w-16 h-16 rounded-full border-4 flex items-center justify-center text-2xl font-bold ${code.length>i?'bg-blue-600 border-blue-600 text-white':'bg-gray-100 border-gray-300 text-transparent'}`}>{code.length>i?'•':'0'}</div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {['1','2','3','4','5','6','7','8','9'].map(num => (
                <button key={num} onClick={() => handleNumberClick(num)} className="touch-button bg-gray-100 hover:bg-gray-200 text-gray-800 h-20 text-3xl" disabled={loading}>{num}</button>
              ))}
              <button onClick={handleClear} className="touch-button bg-red-100 hover:bg-red-200 text-red-700 h-20 text-xl" disabled={loading}>Clear</button>
              <button onClick={() => handleNumberClick('0')} className="touch-button bg-gray-100 hover:bg-gray-200 text-gray-800 h-20 text-3xl" disabled={loading}>0</button>
              <button onClick={login} className={`touch-button h-20 text-xl ${code.length===4&&!loading?'bg-blue-600 hover:bg-blue-700 text-white':'bg-gray-300 text-gray-500 cursor-not-allowed'}`} disabled={code.length!==4||loading}>{loading?'Verifying...':'Enter'}</button>
            </div>
            {error && <p className="text-red-700">{error}</p>}
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-bold mb-2">Welcome, {employee.name}</h1>
            <p className="text-gray-600 mb-6">Here are your recent hours and expenses.</p>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h2 className="font-semibold mb-2">Recent Time Entries</h2>
                <div className="border rounded">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50"><th className="p-2 text-left">Clock In</th><th className="p-2 text-left">Clock Out</th><th className="p-2 text-right">Hours</th></tr>
                    </thead>
                    <tbody>
                      {entries.map((e, i) => {
                        const start = e.clock_in ? new Date(e.clock_in) : null
                        const end = e.clock_out ? new Date(e.clock_out) : null
                        const hours = start && end ? Math.max(0, (end.getTime()-start.getTime())/3600000) : 0
                        return (
                          <tr key={i} className="border-t">
                            <td className="p-2">{start?.toLocaleString()||'-'}</td>
                            <td className="p-2">{end?.toLocaleString()||'-'}</td>
                            <td className="p-2 text-right">{hours.toFixed(2)}</td>
                          </tr>
                        )
                      })}
                      {entries.length===0 && <tr><td className="p-2" colSpan={3}>No entries</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
              <div>
                <h2 className="font-semibold mb-2">Recent Expenses</h2>
                <div className="border rounded">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50"><th className="p-2 text-left">Time</th><th className="p-2 text-left">Description</th><th className="p-2 text-right">Amount</th></tr>
                    </thead>
                    <tbody>
                      {expenses.map((x, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2">{new Date(x.timestamp).toLocaleString()}</td>
                          <td className="p-2">{x.description}</td>
                          <td className="p-2 text-right">${x.amount?.toFixed?.(2) ?? x.amount}</td>
                        </tr>
                      ))}
                      {expenses.length===0 && <tr><td className="p-2" colSpan={3}>No expenses</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
