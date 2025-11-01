'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { calculateSafeBalance } from '@/lib/calculations'
import { format } from 'date-fns'
import type { User } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [safeBalance, setSafeBalance] = useState<number>(0)
  const [todayDrops, setTodayDrops] = useState<number>(0)
  const [todayExpenses, setTodayExpenses] = useState<number>(0)
  const [todayWithdrawals, setTodayWithdrawals] = useState<number>(0)
  const [todayDeposits, setTodayDeposits] = useState<number>(0)
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check authentication
    const userStr = sessionStorage.getItem('admin_user')
    if (!userStr) {
      router.push('/admin/login')
      return
    }
    
    const userData = JSON.parse(userStr) as User
    if (userData.role !== 'admin' && userData.role !== 'manager') {
      router.push('/admin/login')
      return
    }
    
    setUser(userData)
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const today = format(new Date(), 'yyyy-MM-dd')

      // Safe balance
      const balance = await calculateSafeBalance()
      setSafeBalance(balance)

      // Today's drops
      const { data: drops } = await supabase
        .from('safe_drops')
        .select('amount')
        .gte('timestamp', `${today}T00:00:00`)
        .lt('timestamp', `${today}T23:59:59`)
      setTodayDrops(drops?.reduce((sum: number, d: any) => sum + d.amount, 0) || 0)

      // Today's expenses
      const { data: expenses } = await supabase
        .from('expenses')
        .select('amount')
        .eq('date', today)
      setTodayExpenses(expenses?.reduce((sum: number, e: any) => sum + e.amount, 0) || 0)

      // Today's withdrawals
      const { data: withdrawals } = await supabase
        .from('withdrawals')
        .select('amount')
        .gte('timestamp', `${today}T00:00:00`)
        .lt('timestamp', `${today}T23:59:59`)
      setTodayWithdrawals(withdrawals?.reduce((sum: number, w: any) => sum + w.amount, 0) || 0)

      // Today's deposits
      const { data: deposits } = await supabase
        .from('deposits')
        .select('amount')
        .eq('date', today)
      setTodayDeposits(deposits?.reduce((sum: number, d: any) => sum + d.amount, 0) || 0)

      // Recent transactions (last 10 drops)
      const { data: recentDrops } = await supabase
        .from('safe_drops')
        .select('*, users(name)')
        .order('timestamp', { ascending: false })
        .limit(10)
      setRecentTransactions(recentDrops || [])
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-2xl font-semibold text-gray-600">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of today's activity and current balances</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="text-sm font-medium mb-2 text-green-100">Safe Balance</div>
          <div className="text-4xl font-bold">${safeBalance.toFixed(2)}</div>
          <div className="text-sm mt-2 text-green-100">Current total</div>
        </div>

        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="text-sm font-medium mb-2 text-blue-100">Today's Drops</div>
          <div className="text-4xl font-bold">${todayDrops.toFixed(2)}</div>
          <div className="text-sm mt-2 text-blue-100">Cash added to safe</div>
        </div>

        <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
          <div className="text-sm font-medium mb-2 text-red-100">Today's Expenses</div>
          <div className="text-4xl font-bold">${todayExpenses.toFixed(2)}</div>
          <div className="text-sm mt-2 text-red-100">Business costs</div>
        </div>

        <div className="card bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <div className="text-sm font-medium mb-2 text-yellow-100">Today's Withdrawals</div>
          <div className="text-4xl font-bold">${todayWithdrawals.toFixed(2)}</div>
          <div className="text-sm mt-2 text-yellow-100">Cash removed</div>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="text-sm font-medium mb-2 text-purple-100">Today's Deposits</div>
          <div className="text-4xl font-bold">${todayDeposits.toFixed(2)}</div>
          <div className="text-sm mt-2 text-purple-100">Bank deposits</div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Recent Safe Drops</h2>
          <button
            onClick={loadDashboardData}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Refresh
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No transactions yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Time</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">User</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Receipt #</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {format(new Date(transaction.timestamp), 'MMM d, h:mm a')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {transaction.users?.name || 'Unknown'}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">
                      {transaction.receipt_number}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-green-600 text-right">
                      ${transaction.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {transaction.notes || '—'}
                    </td>
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

