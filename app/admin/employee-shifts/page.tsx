'use client'

import { useEffect, useState } from 'react'

export const dynamic = 'force-dynamic'

export default function EmployeeShifts() {
  const [start, setStart] = useState<string>('')
  const [end, setEnd] = useState<string>('')
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    if (!start || !end) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ start, end })
      const [entriesRes, empsRes] = await Promise.all([
        fetch('/api/payroll/weekly?' + params.toString()),
        fetch('/api/employee-expenses/list'),
      ])
      const entriesJson = await entriesRes.json()
      if (entriesRes.ok) setRows(entriesJson.payroll || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const today = new Date()
    const prior = new Date(); prior.setDate(today.getDate()-7)
    const toIso = (d: Date) => d.toISOString().slice(0,10)
    setStart(toIso(prior)); setEnd(toIso(today))
  }, [])

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6 flex items-end gap-4 flex-wrap">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Start</label>
          <input type="date" value={start} onChange={e=>setStart(e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">End</label>
          <input type="date" value={end} onChange={e=>setEnd(e.target.value)} className="input-field" />
        </div>
        <button onClick={load} className="btn-primary">Load</button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-gray-500">No entries</p>
      ) : (
        rows.map((r) => (
          <div key={r.employee.id} className="card mb-4">
            <h3 className="text-lg font-bold mb-2">{r.employee.name}</h3>
            <div className="text-sm text-gray-600 mb-3">Total Hours: {r.totalHours.toFixed(2)}</div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Clock In</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Clock Out</th>
                    <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {r.entries.map((e:any) => {
                    const ci = e.clock_in? new Date(e.clock_in) : null
                    const co = e.clock_out? new Date(e.clock_out) : null
                    const h = ci && co ? (co.getTime()-ci.getTime())/3600000 : 0
                    return (
                      <tr key={e.id}>
                        <td className="px-4 py-2 text-sm">{ci?ci.toLocaleString():'—'}</td>
                        <td className="px-4 py-2 text-sm">{co?co.toLocaleString():'—'}</td>
                        <td className="px-4 py-2 text-sm text-right">{h.toFixed(2)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
