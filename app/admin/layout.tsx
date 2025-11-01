import AdminNav from '@/components/AdminNav'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <main>{children}</main>
    </div>
  )
}

