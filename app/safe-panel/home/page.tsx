'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default function SafePanelHome() {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    const userStr = sessionStorage.getItem('safePanel_user')
    if (!userStr) {
      router.push('/safe-panel')
      return
    }
    setUser(JSON.parse(userStr))
  }, [router])

  const handleLogout = () => {
    sessionStorage.removeItem('safePanel_user')
    router.push('/safe-panel')
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  const isAdmin = user.role === 'admin'

  const menuItems = [
    {
      title: 'Make Safe Drop',
      description: 'Record cash drop to safe',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      ),
      href: '/safe-panel/drop',
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      title: 'Record Expense',
      description: 'Log business expense',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
      ),
      href: '/safe-panel/expense',
      color: 'bg-red-600 hover:bg-red-700',
    },
    {
      title: 'Record Daily Sales',
      description: 'Enter card/cash sales',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      ),
      href: '/safe-panel/sales',
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    
    {
      title: 'End of Shift',
      description: 'Close shift and reconcile',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      ),
      href: '/safe-panel/end-shift',
      color: 'bg-purple-600 hover:bg-purple-700',
    },
  ]

  const adminItems = [
    {
      title: 'Admin Withdrawal',
      description: 'Withdraw from safe',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
      ),
      href: '/safe-panel/withdrawal',
      color: 'bg-yellow-600 hover:bg-yellow-700',
    },
    {
      title: 'Manual Safe Count',
      description: 'Verify safe balance',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      ),
      href: '/safe-panel/safe-count',
      color: 'bg-indigo-600 hover:bg-indigo-700',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 kiosk-mode">
      {/* Header */}
      <div className="bg-primary-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Safe Panel</h1>
            <p className="text-primary-100 mt-1">Welcome, {user.name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Menu */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {menuItems.map((item) => (
            <button
              key={item.title}
              onClick={() => router.push(item.href)}
              className={`${item.color} text-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all active:scale-95`}
            >
              <div className="flex flex-col items-center text-center">
                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {item.icon}
                </svg>
                <h2 className="text-2xl font-bold mb-2">{item.title}</h2>
                <p className="text-white/90">{item.description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Admin-only features */}
        {isAdmin && (
          <>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Admin Functions</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {adminItems.map((item) => (
                <button
                  key={item.title}
                  onClick={() => router.push(item.href)}
                  className={`${item.color} text-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all active:scale-95`}
                >
                  <div className="flex flex-col items-center text-center">
                    <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {item.icon}
                    </svg>
                    <h2 className="text-2xl font-bold mb-2">{item.title}</h2>
                    <p className="text-white/90">{item.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

