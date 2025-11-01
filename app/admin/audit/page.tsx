'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

export default function AuditLog() {
  const [logs, setLogs] = useState<any[]>([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAuditLog()
  }, [])

  const loadAuditLog = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('audit_log')
        .select('*, users(name)')
        .order('changed_at', { ascending: false })
        .limit(500)

      setLogs(data || [])
    } catch (error) {
      console.error('Error loading audit log:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = filter
    ? logs.filter(
        (log) =>
          log.table_name.toLowerCase().includes(filter.toLowerCase()) ||
          log.action.toLowerCase().includes(filter.toLowerCase()) ||
          log.users?.name.toLowerCase().includes(filter.toLowerCase())
      )
    : logs

  const exportToCSV = () => {
    const headers = ['Timestamp', 'User', 'Table', 'Action', 'Record ID']
    const csv = [
      headers.join(','),
      ...filteredLogs.map((log) =>
        [
          format(new Date(log.changed_at), 'yyyy-MM-dd HH:mm:ss'),
          log.users?.name || 'System',
          log.table_name,
          log.action,
          log.record_id,
        ].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-log-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-2xl font-semibold text-gray-600">Loading audit log...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-gray-600 mt-1">Complete history of all system changes (Admin only)</p>
      </div>

      {/* Info */}
      <div className="card mb-6 bg-blue-50 border border-blue-200">
        <div className="flex items-start">
          <svg
            className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="text-sm font-semibold text-blue-900 mb-1">About the Audit Log</h3>
            <p className="text-sm text-blue-800">
              This log records every insert, update, and delete operation across all critical tables.
              Records are immutable and cannot be modified or deleted. This ensures complete accountability
              and traceability for all system activities.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by table, action, or user..."
          className="input-field flex-1"
        />
        <button onClick={exportToCSV} className="btn-primary">
          Export CSV
        </button>
        <button onClick={loadAuditLog} className="btn-secondary">
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="text-sm font-medium mb-1 text-green-100">Inserts</div>
          <div className="text-3xl font-bold">{logs.filter((l) => l.action === 'insert').length}</div>
        </div>
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="text-sm font-medium mb-1 text-blue-100">Updates</div>
          <div className="text-3xl font-bold">{logs.filter((l) => l.action === 'update').length}</div>
        </div>
        <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
          <div className="text-sm font-medium mb-1 text-red-100">Deletes</div>
          <div className="text-3xl font-bold">{logs.filter((l) => l.action === 'delete').length}</div>
        </div>
        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="text-sm font-medium mb-1 text-purple-100">Total Events</div>
          <div className="text-3xl font-bold">{logs.length}</div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Activity</h2>
        {filteredLogs.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No audit records found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Timestamp</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Table</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Record ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-900 font-mono">
                      {format(new Date(log.changed_at), 'MMM d, yyyy HH:mm:ss')}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-900">{log.users?.name || 'System'}</td>
                    <td className="px-4 py-3 text-xs text-gray-900">
                      <span className="px-2 py-1 bg-gray-100 rounded font-mono">{log.table_name}</span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span
                        className={`px-2 py-1 rounded font-semibold ${
                          log.action === 'insert'
                            ? 'bg-green-100 text-green-800'
                            : log.action === 'update'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {log.action.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 font-mono">{log.record_id.slice(0, 8)}...</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

