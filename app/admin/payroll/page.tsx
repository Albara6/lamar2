'use client'

import { useEffect, useMemo, useState } from 'react'

export const dynamic = 'force-dynamic'

function getWeekRange(d = new Date()) {
  const date = new Date(d)
  const day = date.getDay() // 0 Sun - 6 Sat
  const diffToMonday = (day + 6) % 7
  const start = new Date(date)
  start.setDate(date.getDate() - diffToMonday)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  const toIso = (x: Date) => x.toISOString().slice(0, 10)
  return { start: toIso(start), end: toIso(end) }
}

export default function PayrollPage() {
  const initial = getWeekRange()
  const [start, setStart] = useState(initial.start)
  const [end, setEnd] = useState(initial.end)
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<any | null>(null)
  const [rate, setRate] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ start, end })
      const res = await fetch('/api/payroll/weekly?' + params.toString())
      const json = await res.json()
      if (res.ok) setRows(json.payroll || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const totals = useMemo(() => {
    const hours = rows.reduce((s, r) => s + (r.totalHours || 0), 0)
    const expenses = rows.reduce((s, r) => s + (r.expensesTotal || 0), 0)
    return { hours: Number(hours.toFixed(2)), expenses: Number(expenses.toFixed(2)) }
  }, [rows])

  const openDetail = (r: any) => {
    setSelected(r)
    setRate(String(r.employee.hourly_rate || ''))
  }

  const recordPay = async () => {
    if (!selected) return
    const hours = selected.totalHours || 0
    const hr = Number(rate || 0)
    const gross = Number((hours * hr).toFixed(2))
    const expenses = Number((selected.expensesTotal || 0).toFixed(2))
    const net = Number((gross - expenses).toFixed(2))
    const res = await fetch('/api/payroll/record', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employee_id: selected.employee.id,
        week_start: start,
        week_end: end,
        hours,
        hourly_rate: hr,
        gross_pay: gross,
        expenses_total: expenses,
        net_pay: net,
      })
    })
    const json = await res.json()
    if (!res.ok) {
      alert(json?.error || 'Failed to record pay')
      return
    }
    alert('Pay recorded')
    await load()
  }

  const printDetail = () => {
    if (!selected) return
    const w = window.open('', '_blank')
    if (!w) return
    const hours = selected.totalHours || 0
    const hr = Number(rate || selected.employee.hourly_rate || 0)
    const gross = Number((hours * hr).toFixed(2))
    const expenses = Number((selected.expensesTotal || 0).toFixed(2))
    const net = Number((gross - expenses).toFixed(2))
    w.document.write(`
      <html><head><title>Weekly Pay</title>
      <style>
        @page { size: 80mm auto; margin: 4mm; }
        body{font-family:monospace; padding:0; width: 72mm; font-size: 12px}
        .center{text-align:center}
        .line{border-top:1px dashed #000;margin:8px 0}
        .row{display:flex;justify-content:space-between}
      </style>
      </head><body>
      <div class="center" style="font-weight:bold">WEEKLY PAY REPORT</div>
      <div class="line"></div>
      <div class="row"><span>Employee</span><span>${selected.employee.name}</span></div>
      <div class="row"><span>Week</span><span>${start} → ${end}</span></div>
      <div class="line"></div>
      <div class="row"><b>Hours</b><b>${hours.toFixed(2)}</b></div>
      <div class="row"><b>Rate</b><b>$${hr.toFixed(2)}</b></div>
      <div class="row"><b>Gross</b><b>$${gross.toFixed(2)}</b></div>
      <div class="row"><b>Deductions</b><b>$${expenses.toFixed(2)}</b></div>
      <div class="row"><b>Net Pay</b><b>$${net.toFixed(2)}</b></div>
      <div class="line"></div>
      <div><b>Daily Details</b></div>
      ${selected.entries.map((e:any)=>{
        const ci=new Date(e.clock_in); const co=e.clock_out?new Date(e.clock_out):null;
        const h= (ci && co)? ((co.getTime()-ci.getTime())/3600000):0;
        return `<div>- ${ci.toLocaleString()} to ${co?co.toLocaleString():'—'} (${h.toFixed(2)}h)</div>`
      }).join('')}
      <div class="line"></div>
      <div><b>Expenses</b></div>
      ${selected.expenses.map((x:any)=> `<div>- ${new Date(x.timestamp).toLocaleString()} $${Number(x.amount).toFixed(2)} ${x.description}</div>`).join('')}
      </body></html>
    `)
    w.document.close(); w.print()
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6 flex items-end gap-4 flex-wrap">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Week Start</label>
          <input type="date" value={start} onChange={e=>setStart(e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Week End</label>
          <input type="date" value={end} onChange={e=>setEnd(e.target.value)} className="input-field" />
        </div>
        <button onClick={load} className="btn-primary">Load</button>
        <div className="ml-auto text-sm text-gray-700">Total Hours: <b>{totals.hours.toFixed(2)}</b> · Total Deductions: <b>${totals.expenses.toFixed(2)}</b></div>
      </div>

      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Weekly Summary</h2>
        {loading ? (
          <p className="text-gray-500">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-gray-500">No entries in this range</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Employee</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Hours</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Deductions</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rows.map((r) => (
                  <tr key={r.employee.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{r.employee.name}</td>
                    <td className="px-4 py-3 text-sm text-right">{r.totalHours.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right">${r.expensesTotal.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      {r.paid ? (
                        <span className="text-green-700 text-sm">Paid {new Date(r.paid_at).toLocaleString()}</span>
                      ) : (
                        <button onClick={()=>openDetail(r)} className="btn-secondary">Details</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl">
            <h3 className="text-xl font-bold mb-4">{selected.employee.name} · {start} → {end}</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-sm text-gray-600">Hours</div>
                <div className="text-2xl font-bold">{selected.totalHours.toFixed(2)}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-sm text-gray-600">Deductions</div>
                <div className="text-2xl font-bold">${selected.expensesTotal.toFixed(2)}</div>
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-sm text-gray-600 mb-1">Hourly Rate</label>
              <input type="number" step="0.01" value={rate} onChange={e=>setRate(e.target.value)} className="input-field" />
            </div>
            <div className="flex gap-3">
              <button onClick={recordPay} className="btn-primary" disabled={!!selected.paid}>Record Pay</button>
              <button onClick={printDetail} className="btn-secondary">Print Report</button>
              <button onClick={()=>setSelected(null)} className="ml-auto btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
