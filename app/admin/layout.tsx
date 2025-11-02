"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminNav from '@/components/AdminNav'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('admin_user')
      if (!stored) {
        router.replace('/admin/login')
      }
    } catch {}
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <main>{children}</main>
    </div>
  )
}

