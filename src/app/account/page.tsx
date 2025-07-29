'use client'

import { useAuth } from '@/lib/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'

interface Order {
  id: string
  total_amount: number
  payment_method: string
  order_status: string
  created_at: string
  order_items: Array<{
    id: string
    menu_item: { name: string }
    menu_item_size: { name: string } | null
    quantity: number
    special_instructions?: string
    order_item_modifiers: Array<{
      modifier_item: { name: string }
    }>
  }>
}

export default function AccountPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState<'profile' | 'orders'>('profile')
  const [profile, setProfile] = useState({ name: '', email: '', phone: '' })
  const [orders, setOrders] = useState<Order[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/menu')
      return
    }

    // Load profile
    fetch('/api/customer/profile')
      .then(res => res.json())
      .then(data => {
        if (data.customer) {
          setProfile(data.customer)
        }
      })

    // Load orders
    fetch('/api/customer/orders')
      .then(res => res.json())
      .then(data => {
        if (data.orders) {
          setOrders(data.orders)
        }
      })
  }, [user, loading, router])

  const saveProfile = async () => {
    try {
      setSaving(true)
      setError('')
      const res = await fetch('/api/customer/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      
      // Show re-verify message if email/phone changed
      if (profile.email !== user?.email || profile.phone !== user?.phone) {
        setError('Please check your email/phone for verification instructions')
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading || !user) return null

  return (
    <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '1rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={() => router.push('/menu')}
          style={{
            background: 'none',
            border: 'none',
            padding: '0.5rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#374151'
          }}
        >
          <ArrowLeft size={20} />
          <span>Back to Menu</span>
        </button>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginTop: '1rem' }}>Account</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button
          onClick={() => setActiveTab('profile')}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '0.375rem',
            border: 'none',
            background: activeTab === 'profile' ? '#dc2626' : '#f3f4f6',
            color: activeTab === 'profile' ? 'white' : '#374151',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '0.375rem',
            border: 'none',
            background: activeTab === 'orders' ? '#dc2626' : '#f3f4f6',
            color: activeTab === 'orders' ? 'white' : '#374151',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Order History
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div style={{ maxWidth: '32rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151' }}>Name</label>
            <input
              value={profile.name}
              onChange={e => setProfile({ ...profile, name: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem'
              }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151' }}>Email</label>
            <input
              type="email"
              value={profile.email}
              onChange={e => setProfile({ ...profile, email: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem'
              }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151' }}>Phone</label>
            <input
              value={profile.phone}
              onChange={e => setProfile({ ...profile, phone: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem'
              }}
            />
          </div>
          {error && (
            <p style={{ color: error.includes('verification') ? '#059669' : '#dc2626', marginBottom: '1rem' }}>
              {error}
            </p>
          )}
          <button
            onClick={saveProfile}
            disabled={saving}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              fontWeight: '600',
              cursor: 'pointer',
              opacity: saving ? 0.6 : 1
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div>
          {orders.length === 0 ? (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>No orders yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {orders.map(order => (
                <div
                  key={order.id}
                  style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: '0.5rem',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                      <p style={{ fontWeight: '600', color: '#374151' }}>
                        Order #{order.id.slice(0, 8)}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        {order.payment_method === 'online' ? 'Card' : 'Cash'}
                      </p>
                      <p style={{ fontWeight: '600', color: '#374151' }}>
                        ${order.total_amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div>
                    {order.order_items.map(item => (
                      <div key={item.id} style={{ marginBottom: '0.5rem' }}>
                        <p style={{ color: '#374151' }}>
                          {item.quantity}x {item.menu_item.name}
                          {item.menu_item_size && ` (${item.menu_item_size.name})`}
                        </p>
                        {item.order_item_modifiers.length > 0 && (
                          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            + {item.order_item_modifiers.map(mod => mod.modifier_item.name).join(', ')}
                          </p>
                        )}
                        {item.special_instructions && (
                          <p style={{ fontSize: '0.875rem', color: '#6b7280', fontStyle: 'italic' }}>
                            Note: {item.special_instructions}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: '1rem' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        background: order.order_status === 'completed' ? '#dcfce7' : '#fef3c7',
                        color: order.order_status === 'completed' ? '#059669' : '#d97706'
                      }}
                    >
                      {order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
} 