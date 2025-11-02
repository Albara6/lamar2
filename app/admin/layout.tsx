"use client"

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import AdminNav from '@/components/AdminNav'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [authorized, setAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    try {
      if (pathname === '/admin/login') {
        setAuthorized(true)
        return
      }
      const stored = sessionStorage.getItem('admin_user')
      if (!stored) {
        setAuthorized(false)
        router.replace('/admin/login')
        return
      }
      setAuthorized(true)
    } catch {
      setAuthorized(false)
      router.replace('/admin/login')
    }
  }, [router, pathname])

  if (authorized === null) {
    return <div className="min-h-screen bg-gray-50" />
  }

  if (!authorized) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <main>{children}</main>
    </div>
  )
}

