'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Edit, Trash2, Save, X, Eye, EyeOff, Upload, Printer, Settings, ShoppingBag, Building, Clock, CheckCircle, XCircle, RotateCcw } from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  description: string
  category: string
  image_url?: string
  base_price: number
  is_available: boolean
  sort_order: number
  menu_item_sizes?: MenuItemSize[]
  menu_item_modifier_groups?: MenuItemModifierGroup[]
}

interface MenuItemSize {
  id: string
  menu_item_id: string
  name: string
  price_modifier: number
  is_default: boolean
  sort_order: number
}

interface ModifierGroup {
  id: string
  name: string
  is_required: boolean
  max_selections?: number
  min_selections: number
  sort_order: number
  modifier_items?: ModifierItem[]
}

interface ModifierItem {
  id: string
  group_id: string
  name: string
  price: number
  is_default: boolean
  sort_order: number
}

interface MenuItemModifierGroup {
  id: string
  menu_item_id: string
  modifier_group_id: string
  modifier_groups: ModifierGroup
}

interface BusinessSettings {
  id: string
  name: string
  phone: string
  email: string
  address: string
  hours: any
  is_accepting_orders: boolean
  banner_enabled: boolean
  banner_text: string
}

interface Order {
  id: string
  customer_name: string
  customer_phone: string
  customer_email: string
  total_amount: number
  payment_method: string
  payment_status: string
  order_status: string
  created_at: string
  order_items?: OrderItem[]
  rejection_reason?: string
  special_instructions?: string
}

interface OrderItem {
  id: string
  menu_item_name: string
  size_name?: string
  quantity: number
  unit_price: number
  total_price: number
  special_instructions?: string
  order_item_modifiers?: OrderItemModifier[]
}

interface OrderItemModifier {
  id: string
  modifier_name: string
  price: number
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [passcode, setPasscode] = useState('')
  const [showPasscode, setShowPasscode] = useState(false)
  const [activeTab, setActiveTab] = useState('orders') // Orders is now the default tab
  const [showRejectionModal, setShowRejectionModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  
  const REJECTION_REASONS = [
    'Order too large, please use online payment method',
    'Kitchen Closed',
    'Out of items ordered'
  ]
  
  // Data states
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([])
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [orderHistory, setOrderHistory] = useState<Order[]>([])
  
  // Modal states
  const [showMenuItemModal, setShowMenuItemModal] = useState(false)
  const [showModifierGroupModal, setShowModifierGroupModal] = useState(false)
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null)
  const [editingModifierGroup, setEditingModifierGroup] = useState<ModifierGroup | null>(null)
  
  // Form states
  const [menuItemForm, setMenuItemForm] = useState({
    name: '',
    description: '',
    category: 'burgers',
    base_price: 0,
    is_available: true,
    sort_order: 0
  })
  
  const [modifierGroupForm, setModifierGroupForm] = useState({
    name: '',
    is_required: false,
    max_selections: 1,
    min_selections: 0,
    sort_order: 0
  })

  const [loading, setLoading] = useState(false)
  
  // Audio notification system
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlayingSound, setIsPlayingSound] = useState(false)

  // Initialize audio on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/notification.mp3')
      audioRef.current.loop = false
      audioRef.current.volume = 0.7
      
      // Handle audio loading errors gracefully
      audioRef.current.addEventListener('error', () => {
        console.log('Notification sound file not found - sound alerts disabled')
        audioRef.current = null
      })
    }
  }, [])

  // Play notification sound (with fallback)
  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(error => {
        console.log('Audio play failed:', error)
        // Fallback: Use browser notification API or console log
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('New Order!', {
            body: 'New order received in admin panel',
            icon: '/favicon.ico'
          })
        } else {
          console.log('🔔 NEW ORDER ALERT! Check admin panel.')
        }
      })
    } else {
      // Silent fallback when no audio file
      console.log('🔔 NEW ORDER ALERT! (Sound disabled - add notification.mp3)')
    }
  }

  // Poll orders every 5 seconds (more stable)
  useEffect(() => {
    if (!authenticated) return
    
    const interval = setInterval(() => {
      fetchOrders()
    }, 5000)
    
    return () => clearInterval(interval)
  }, [authenticated])

  // Sound alert for new pending orders (stable version)
  useEffect(() => {
    const newOrders = orders.filter(o => 
      o.order_status === 'pending' && 
      (o.payment_status === 'paid' || o.payment_method === 'cash')
    )
    
    if (newOrders.length > 0) {
      if (!isPlayingSound) {
        setIsPlayingSound(true)
        playNotificationSound()
      }
    } else if (isPlayingSound) {
      setIsPlayingSound(false)
    }
  }, [orders.length, isPlayingSound]) // Stable dependencies

  useEffect(() => {
    if (authenticated) {
      fetchAllData()
    }
  }, [authenticated])

  const handleLogin = () => {
    if (passcode === '5548247') {
      setAuthenticated(true)
      setPasscode('')
    } else {
      alert('Incorrect passcode')
      setPasscode('')
    }
  }

  const fetchAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchMenuItems(),
        fetchModifierGroups(),
        fetchBusinessSettings(),
        fetchOrders()
      ])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    }
    setLoading(false)
  }

  const fetchMenuItems = async () => {
    try {
      const response = await fetch('/api/admin/menu-items')
      const data = await response.json()
      setMenuItems(data.menuItems || [])
    } catch (error) {
      console.error('Failed to fetch menu items:', error)
    }
  }

  const fetchModifierGroups = async () => {
    try {
      const response = await fetch('/api/admin/modifier-groups')
      const data = await response.json()
      setModifierGroups(data.modifierGroups || [])
    } catch (error) {
      console.error('Failed to fetch modifier groups:', error)
    }
  }

  const fetchBusinessSettings = async () => {
    try {
      const response = await fetch('/api/admin/business-settings')
      const data = await response.json()
      setBusinessSettings(data.businessSettings)
    } catch (error) {
      console.error('Failed to fetch business settings:', error)
    }
  }

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/admin/orders')
      const data = await response.json()
      const allOrders = data.orders || []
      
      // Separate active orders from history
      const activeOrders = allOrders.filter((order: Order) => 
        order.order_status === 'pending' || order.order_status === 'accepted'
      )
      const historyOrders = allOrders.filter((order: Order) => 
        order.order_status === 'ready' || order.order_status === 'completed' || order.order_status === 'rejected'
      ).slice(0, 100) // Keep last 100 orders
      
      setOrders(activeOrders)
      setOrderHistory(historyOrders)
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    }
  }

  // Accept order - change to accepted status and auto-print receipt
  const handleAccept = async (order: Order) => {
    try {
      // For cash orders, also mark payment as paid when accepted
      const updateData = order.payment_method === 'cash' 
        ? { order_status: 'accepted', payment_status: 'paid' }
        : { order_status: 'accepted' }

      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })
      
      if (response.ok) {
        // Auto-print receipt
        printReceipt(order)
        await fetchOrders()
        setIsPlayingSound(false) // Stop sound when order is accepted
      } else {
        alert('Failed to accept order')
      }
    } catch (error) {
      console.error('Failed to accept order:', error)
      alert('Failed to accept order')
    }
  }

  // Enhanced receipt printing
  const printReceipt = (order: Order) => {
    const win = window.open('', '_blank', 'width=400,height=600')
    if (!win) return
    
    const receiptHTML = `
      <html>
        <head>
          <title>Receipt - Order #${order.id.slice(-8)}</title>
          <style>
            body { font-family: 'Courier New', monospace; font-size: 12px; margin: 20px; }
            .header { text-align: center; border-bottom: 1px solid #000; padding-bottom: 10px; }
            .order-details { margin: 20px 0; }
            .item { margin: 5px 0; display: flex; justify-content: space-between; }
            .total { border-top: 1px solid #000; padding-top: 10px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>🍗 CRAZY CHICKEN</h2>
            <p>Order #${order.id.slice(-8)}</p>
            <p>${new Date(order.created_at).toLocaleString()}</p>
          </div>
          <div class="order-details">
            <p><strong>Customer:</strong> ${order.customer_name}</p>
            <p><strong>Phone:</strong> ${order.customer_phone}</p>
            <p><strong>Payment:</strong> ${order.payment_method.toUpperCase()}</p>
            ${order.special_instructions ? `<p><strong>Notes:</strong> ${order.special_instructions}</p>` : ''}
          </div>
          <div class="items">
            ${order.order_items?.map(item => `
              <div class="item">
                <span>${item.quantity}x ${item.menu_item_name}${item.size_name ? ` (${item.size_name})` : ''}</span>
                <span>$${item.total_price.toFixed(2)}</span>
              </div>
              ${item.order_item_modifiers?.map(mod => `
                <div style="margin-left: 20px; color: #666;">
                  <span>+ ${mod.modifier_name}</span>
                  <span>$${mod.price.toFixed(2)}</span>
                </div>
              `).join('') || ''}
              ${item.special_instructions ? `<div style="margin-left: 20px; font-style: italic; color: #666;">Note: ${item.special_instructions}</div>` : ''}
            `).join('') || ''}
          </div>
          <div class="total">
            <div class="item">
              <span>TOTAL:</span>
              <span>$${order.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </body>
      </html>
    `
    
    win.document.write(receiptHTML)
    win.document.close()
    win.focus()
    win.print()
    win.close()
  }

  // Mark order as ready for pickup
  const handleReady = async (order: Order) => {
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/ready`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        await fetchOrders()
      } else {
        alert('Failed to mark order as ready')
      }
    } catch (error) {
      console.error('Failed to mark order as ready:', error)
      alert('Failed to mark order as ready')
    }
  }

  // Reject order with reason
  const handleReject = async (order: Order, reason: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejection_reason: reason })
      })
      
      if (response.ok) {
        setShowRejectionModal(false)
        setSelectedOrder(null)
        setIsPlayingSound(false) // Stop sound when order is rejected
        await fetchOrders()
      } else {
        alert('Failed to reject order')
      }
    } catch (error) {
      console.error('Failed to reject order:', error)
      alert('Failed to reject order')
    }
  }

  const openRejectionModal = (order: Order) => {
    setSelectedOrder(order)
    setShowRejectionModal(true)
  }

  // Reprint receipt from order history
  const reprintReceipt = (order: Order) => {
    printReceipt(order)
  }

  // ... existing modal functions for menu items and modifiers ...
  const saveMenuItem = async () => {
    setLoading(true)
    try {
      const url = editingMenuItem ? `/api/admin/menu-items/${editingMenuItem.id}` : '/api/admin/menu-items'
      const method = editingMenuItem ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(menuItemForm)
      })
      
      if (response.ok) {
        await fetchMenuItems()
        closeMenuItemModal()
      } else {
        alert('Failed to save menu item')
      }
    } catch (error) {
      console.error('Failed to save menu item:', error)
      alert('Failed to save menu item')
    }
    setLoading(false)
  }

  const deleteMenuItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/menu-items/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await fetchMenuItems()
      } else {
        alert('Failed to delete menu item')
      }
    } catch (error) {
      console.error('Failed to delete menu item:', error)
      alert('Failed to delete menu item')
    }
    setLoading(false)
  }

  const saveModifierGroup = async () => {
    setLoading(true)
    try {
      const url = editingModifierGroup ? `/api/admin/modifier-groups/${editingModifierGroup.id}` : '/api/admin/modifier-groups'
      const method = editingModifierGroup ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modifierGroupForm)
      })
      
      if (response.ok) {
        await fetchModifierGroups()
        closeModifierGroupModal()
      } else {
        alert('Failed to save modifier group')
      }
    } catch (error) {
      console.error('Failed to save modifier group:', error)
      alert('Failed to save modifier group')
    }
    setLoading(false)
  }

  const deleteModifierGroup = async (id: string) => {
    if (!confirm('Are you sure you want to delete this modifier group?')) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/modifier-groups/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await fetchModifierGroups()
      } else {
        alert('Failed to delete modifier group')
      }
    } catch (error) {
      console.error('Failed to delete modifier group:', error)
      alert('Failed to delete modifier group')
    }
    setLoading(false)
  }

  const openMenuItemModal = (item?: MenuItem) => {
    if (item) {
      setEditingMenuItem(item)
      setMenuItemForm({
        name: item.name,
        description: item.description,
        category: item.category,
        base_price: item.base_price,
        is_available: item.is_available,
        sort_order: item.sort_order
      })
    } else {
      setEditingMenuItem(null)
      setMenuItemForm({
        name: '',
        description: '',
        category: 'burgers',
        base_price: 0,
        is_available: true,
        sort_order: 0
      })
    }
    setShowMenuItemModal(true)
  }

  const closeMenuItemModal = () => {
    setShowMenuItemModal(false)
    setEditingMenuItem(null)
  }

  const openModifierGroupModal = (group?: ModifierGroup) => {
    if (group) {
      setEditingModifierGroup(group)
      setModifierGroupForm({
        name: group.name,
        is_required: group.is_required,
        max_selections: group.max_selections || 1,
        min_selections: group.min_selections,
        sort_order: group.sort_order
      })
    } else {
      setEditingModifierGroup(null)
      setModifierGroupForm({
        name: '',
        is_required: false,
        max_selections: 1,
        min_selections: 0,
        sort_order: 0
      })
    }
    setShowModifierGroupModal(true)
  }

  const closeModifierGroupModal = () => {
    setShowModifierGroupModal(false)
    setEditingModifierGroup(null)
  }

  if (!authenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #fef2f2 0%, #fefce8 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '0.5rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          width: '100%',
          maxWidth: '24rem'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              🍗 Crazy Chicken Admin
            </h1>
            <p style={{ color: '#6b7280' }}>Enter passcode to access admin panel</p>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: '500', 
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Passcode
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPasscode ? 'text' : 'password'}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  paddingRight: '3rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: '1rem'
                }}
                placeholder="Enter passcode"
              />
              <button
                type="button"
                onClick={() => setShowPasscode(!showPasscode)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer'
                }}
              >
                {showPasscode ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          
          <button
            onClick={handleLogin}
            style={{
              width: '100%',
              backgroundColor: '#dc2626',
              color: 'white',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Access Admin Panel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#dc2626',
        color: 'white',
        padding: '1rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center' 
          }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              🍗 Crazy Chicken Admin Panel
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {isPlayingSound && (
                <div style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  🔔 New Orders!
                </div>
              )}
              <button
                onClick={() => setAuthenticated(false)}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs - Orders moved to first position */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '0 1rem'
      }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '2rem' }}>
            {[
              { id: 'orders', label: 'Orders', icon: <ShoppingBag size={18} /> },
              { id: 'history', label: 'Order History', icon: <Clock size={18} /> },
              { id: 'menu', label: 'Menu Items', icon: <ShoppingBag size={18} /> },
              { id: 'modifiers', label: 'Modifiers', icon: <Settings size={18} /> },
              { id: 'settings', label: 'Business Settings', icon: <Building size={18} /> },
              { id: 'printer', label: 'Printer Settings', icon: <Printer size={18} /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '1rem 0',
                  border: 'none',
                  background: 'none',
                  color: activeTab === tab.id ? '#dc2626' : '#6b7280',
                  fontWeight: activeTab === tab.id ? '600' : '400',
                  borderBottom: `2px solid ${activeTab === tab.id ? '#dc2626' : 'transparent'}`,
                  cursor: 'pointer'
                }}
              >
                {tab.icon}
                {tab.label}
                {tab.id === 'orders' && orders.length > 0 && (
                  <span style={{
                    backgroundColor: '#dc2626',
                    color: 'white',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}>
                    {orders.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1rem' }}>
        {loading && (
          <div style={{ 
            textAlign: 'center', 
            color: '#6b7280', 
            marginBottom: '2rem' 
          }}>
            Loading...
          </div>
        )}

        {/* Orders Tab - Now first and comprehensive */}
        {activeTab === 'orders' && (
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '2rem'
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#374151' }}>
                Active Orders ({orders.length})
              </h2>
                             <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                 Auto-refresh every 5 seconds
               </div>
            </div>

            {orders.length === 0 ? (
              <div style={{
                backgroundColor: 'white',
                padding: '3rem',
                borderRadius: '0.5rem',
                textAlign: 'center',
                color: '#6b7280'
              }}>
                <ShoppingBag size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No Active Orders</h3>
                <p>New orders will appear here automatically</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {orders.map(order => (
                  <div
                    key={order.id}
                    style={{
                      backgroundColor: 'white',
                      padding: '2rem',
                      borderRadius: '0.75rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                             border: order.order_status === 'pending' && 
                               (order.payment_status === 'paid' || order.payment_method === 'cash') ? 
                               '3px solid #dc2626' : '1px solid #e5e7eb'
                    }}
                  >
                    {/* Order Header */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start',
                      marginBottom: '1.5rem',
                      paddingBottom: '1rem',
                      borderBottom: '1px solid #e5e7eb'
                    }}>
                      <div>
                        <h3 style={{ 
                          fontSize: '1.5rem', 
                          fontWeight: 'bold', 
                          color: '#374151',
                          marginBottom: '0.5rem'
                        }}>
                          Order #{order.id.slice(-8)}
                                                     {order.order_status === 'pending' && 
                            (order.payment_status === 'paid' || order.payment_method === 'cash') && (
                             <span style={{ 
                               marginLeft: '0.5rem',
                               backgroundColor: '#dc2626',
                               color: 'white',
                               padding: '0.25rem 0.5rem',
                               borderRadius: '0.25rem',
                               fontSize: '0.75rem',
                               opacity: '0.8'
                             }}>
                               NEW!
                             </span>
                           )}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <p style={{ color: '#374151', fontSize: '1.125rem', fontWeight: '600' }}>
                            👤 {order.customer_name}
                          </p>
                          <p style={{ color: '#6b7280', fontSize: '1rem' }}>
                            📞 {order.customer_phone}
                          </p>
                          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                            🕒 {new Date(order.created_at).toLocaleString()}
                          </p>
                          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                            💳 {order.payment_method.toUpperCase()} - {order.payment_status.toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ 
                          fontSize: '2rem', 
                          fontWeight: 'bold', 
                          color: '#dc2626',
                          marginBottom: '0.5rem'
                        }}>
                          ${order.total_amount.toFixed(2)}
                        </div>
                        <div style={{ 
                          padding: '0.5rem 1rem',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          backgroundColor: order.order_status === 'pending' ? '#fef3c7' : '#d1fae5',
                          color: order.order_status === 'pending' ? '#92400e' : '#065f46'
                        }}>
                          {order.order_status.toUpperCase()}
                        </div>
                      </div>
                    </div>
                    
                    {/* Order Items */}
                    {order.order_items && (
                      <div style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{ 
                          fontSize: '1.125rem', 
                          fontWeight: '600', 
                          color: '#374151',
                          marginBottom: '1rem'
                        }}>
                          📋 Order Items:
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {order.order_items.map(item => (
                            <div key={item.id} style={{ 
                              backgroundColor: '#f9fafb',
                              padding: '1rem',
                              borderRadius: '0.5rem',
                              border: '1px solid #e5e7eb'
                            }}>
                              <div style={{ 
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '0.5rem'
                              }}>
                                <span style={{ 
                                  fontSize: '1.125rem',
                                  fontWeight: '600',
                                  color: '#374151'
                                }}>
                                  {item.quantity}x {item.menu_item_name}
                                  {item.size_name && ` (${item.size_name})`}
                                </span>
                                <span style={{ 
                                  fontSize: '1.125rem',
                                  fontWeight: '600',
                                  color: '#dc2626'
                                }}>
                                  ${item.total_price.toFixed(2)}
                                </span>
                              </div>
                              
                              {/* Modifiers */}
                              {item.order_item_modifiers && item.order_item_modifiers.length > 0 && (
                                <div style={{ marginLeft: '1rem', marginBottom: '0.5rem' }}>
                                  {item.order_item_modifiers.map(mod => (
                                    <div key={mod.id} style={{ 
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      color: '#6b7280',
                                      fontSize: '0.875rem'
                                    }}>
                                      <span>+ {mod.modifier_name}</span>
                                      <span>${mod.price.toFixed(2)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {/* Special Instructions */}
                              {item.special_instructions && (
                                <div style={{ 
                                  marginLeft: '1rem',
                                  fontStyle: 'italic',
                                  color: '#dc2626',
                                  fontSize: '0.875rem',
                                  backgroundColor: '#fef2f2',
                                  padding: '0.5rem',
                                  borderRadius: '0.25rem',
                                  marginTop: '0.5rem'
                                }}>
                                  📝 Note: {item.special_instructions}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Order Special Instructions */}
                    {order.special_instructions && (
                      <div style={{ 
                        marginBottom: '1.5rem',
                        padding: '1rem',
                        backgroundColor: '#fef2f2',
                        borderRadius: '0.5rem',
                        border: '1px solid #fecaca'
                      }}>
                        <h4 style={{ 
                          fontSize: '1rem', 
                          fontWeight: '600', 
                          color: '#dc2626',
                          marginBottom: '0.5rem'
                        }}>
                          📝 Order Notes:
                        </h4>
                        <p style={{ color: '#991b1b', fontStyle: 'italic' }}>
                          {order.special_instructions}
                        </p>
                      </div>
                    )}
                    
                                         {/* Action Buttons */}
                     <div style={{ 
                       display: 'flex', 
                       gap: '1rem', 
                       justifyContent: 'flex-end',
                       borderTop: '1px solid #e5e7eb',
                       paddingTop: '1rem'
                     }}>
                       {/* Show buttons for pending orders (both online paid and cash orders) */}
                       {order.order_status === 'pending' && 
                        (order.payment_status === 'paid' || order.payment_method === 'cash') && (
                         <>
                           {/* BIG GREEN ACCEPT BUTTON */}
                           <button 
                             onClick={() => handleAccept(order)}
                             style={{
                               backgroundColor: '#10b981',
                               color: 'white',
                               padding: '1rem 2rem',
                               fontSize: '1.25rem',
                               fontWeight: 'bold',
                               border: 'none',
                               borderRadius: '0.75rem',
                               cursor: 'pointer',
                               display: 'flex',
                               alignItems: 'center',
                               gap: '0.5rem',
                               boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                               transition: 'all 0.2s'
                             }}
                             onMouseOver={(e) => {
                               e.currentTarget.style.backgroundColor = '#059669'
                               e.currentTarget.style.transform = 'translateY(-2px)'
                             }}
                             onMouseOut={(e) => {
                               e.currentTarget.style.backgroundColor = '#10b981'
                               e.currentTarget.style.transform = 'translateY(0)'
                             }}
                           >
                             <CheckCircle size={24} />
                             START PREPARING
                           </button>
                           
                           {/* SMALL RED REJECT BUTTON */}
                           <button 
                             onClick={() => openRejectionModal(order)}
                             style={{
                               backgroundColor: '#dc2626',
                               color: 'white',
                               padding: '0.5rem 1rem',
                               fontSize: '0.875rem',
                               fontWeight: '500',
                               border: 'none',
                               borderRadius: '0.5rem',
                               cursor: 'pointer',
                               display: 'flex',
                               alignItems: 'center',
                               gap: '0.25rem'
                             }}
                           >
                             <XCircle size={16} />
                             reject
                           </button>
                         </>
                       )}
                       
                       {order.order_status === 'accepted' && (
                         <button 
                           onClick={() => handleReady(order)}
                           style={{
                             backgroundColor: '#f59e0b',
                             color: 'white',
                             padding: '0.75rem 1.5rem',
                             fontSize: '1rem',
                             fontWeight: '600',
                             border: 'none',
                             borderRadius: '0.5rem',
                             cursor: 'pointer',
                             display: 'flex',
                             alignItems: 'center',
                             gap: '0.5rem'
                           }}
                         >
                           <CheckCircle size={20} />
                           Mark Ready for Pickup
                         </button>
                       )}
                     </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Order History Tab */}
        {activeTab === 'history' && (
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '2rem'
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#374151' }}>
                Order History ({orderHistory.length}/100)
              </h2>
            </div>

            {orderHistory.length === 0 ? (
              <div style={{
                backgroundColor: 'white',
                padding: '3rem',
                borderRadius: '0.5rem',
                textAlign: 'center',
                color: '#6b7280'
              }}>
                <Clock size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No Order History</h3>
                <p>Completed and rejected orders will appear here</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {orderHistory.map(order => (
                  <div
                    key={order.id}
                    style={{
                      backgroundColor: 'white',
                      padding: '1.5rem',
                      borderRadius: '0.5rem',
                      boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)',
                      border: `1px solid ${
                        order.order_status === 'completed' ? '#d1fae5' :
                        order.order_status === 'rejected' ? '#fee2e2' : '#e5e7eb'
                      }`
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center' 
                    }}>
                      <div>
                        <h3 style={{ 
                          fontSize: '1.125rem', 
                          fontWeight: 'bold', 
                          color: '#374151',
                          marginBottom: '0.25rem'
                        }}>
                          Order #{order.id.slice(-8)}
                        </h3>
                        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                          {order.customer_name} • {order.customer_phone}
                        </p>
                        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                          {new Date(order.created_at).toLocaleString()}
                        </p>
                        {order.rejection_reason && (
                          <p style={{ 
                            color: '#dc2626', 
                            fontSize: '0.875rem',
                            fontStyle: 'italic',
                            marginTop: '0.25rem'
                          }}>
                            Rejected: {order.rejection_reason}
                          </p>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div>
                          <div style={{ 
                            fontSize: '1.25rem', 
                            fontWeight: 'bold', 
                            color: '#374151',
                            marginBottom: '0.5rem'
                          }}>
                            ${order.total_amount.toFixed(2)}
                          </div>
                          <div style={{ 
                            padding: '0.25rem 0.75rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            backgroundColor: 
                              order.order_status === 'completed' ? '#d1fae5' :
                              order.order_status === 'rejected' ? '#fee2e2' : '#f3f4f6',
                            color: 
                              order.order_status === 'completed' ? '#065f46' :
                              order.order_status === 'rejected' ? '#991b1b' : '#374151'
                          }}>
                            {order.order_status.toUpperCase()}
                          </div>
                        </div>
                        <button
                          onClick={() => reprintReceipt(order)}
                          style={{
                            backgroundColor: '#6b7280',
                            color: 'white',
                            padding: '0.5rem',
                            borderRadius: '0.25rem',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                          title="Reprint Receipt"
                        >
                          <Printer size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Menu Items Tab */}
        {activeTab === 'menu' && (
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '2rem'
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#374151' }}>
                Menu Items
              </h2>
              <button
                onClick={() => openMenuItemModal()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <Plus size={18} />
                Add Menu Item
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}>
              {menuItems.map(item => (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: 'white',
                    padding: '1.5rem',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '1rem'
                  }}>
                    <div>
                      <h3 style={{ 
                        fontSize: '1.125rem', 
                        fontWeight: 'bold', 
                        color: '#374151',
                        marginBottom: '0.25rem'
                      }}>
                        {item.name}
                      </h3>
                      <p style={{ 
                        color: item.is_available ? '#10b981' : '#ef4444',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}>
                        {item.is_available ? 'Available' : 'Unavailable'}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => openMenuItemModal(item)}
                        style={{
                          padding: '0.5rem',
                          backgroundColor: '#f3f4f6',
                          border: 'none',
                          borderRadius: '0.25rem',
                          cursor: 'pointer'
                        }}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => deleteMenuItem(item.id)}
                        style={{
                          padding: '0.5rem',
                          backgroundColor: '#fef2f2',
                          color: '#ef4444',
                          border: 'none',
                          borderRadius: '0.25rem',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <p style={{ 
                    color: '#6b7280', 
                    fontSize: '0.875rem',
                    marginBottom: '1rem'
                  }}>
                    {item.description}
                  </p>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center' 
                  }}>
                    <span style={{ 
                      fontSize: '1.25rem', 
                      fontWeight: 'bold', 
                      color: '#dc2626' 
                    }}>
                      ${item.base_price.toFixed(2)}
                    </span>
                    <span style={{ 
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      textTransform: 'capitalize'
                    }}>
                      {item.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modifiers Tab */}
        {activeTab === 'modifiers' && (
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '2rem'
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#374151' }}>
                Modifier Groups
              </h2>
              <button
                onClick={() => openModifierGroupModal()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <Plus size={18} />
                Add Modifier Group
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}>
              {modifierGroups.map(group => (
                <div
                  key={group.id}
                  style={{
                    backgroundColor: 'white',
                    padding: '1.5rem',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '1rem'
                  }}>
                    <div>
                      <h3 style={{ 
                        fontSize: '1.125rem', 
                        fontWeight: 'bold', 
                        color: '#374151',
                        marginBottom: '0.25rem'
                      }}>
                        {group.name}
                        {group.is_required && (
                          <span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>
                        )}
                      </h3>
                      <p style={{ 
                        color: '#6b7280',
                        fontSize: '0.875rem'
                      }}>
                        {group.is_required ? 'Required' : 'Optional'} • 
                        Min: {group.min_selections} • 
                        Max: {group.max_selections || 'Unlimited'}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => openModifierGroupModal(group)}
                        style={{
                          padding: '0.5rem',
                          backgroundColor: '#f3f4f6',
                          border: 'none',
                          borderRadius: '0.25rem',
                          cursor: 'pointer'
                        }}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => deleteModifierGroup(group.id)}
                        style={{
                          padding: '0.5rem',
                          backgroundColor: '#fef2f2',
                          color: '#ef4444',
                          border: 'none',
                          borderRadius: '0.25rem',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  {group.modifier_items && group.modifier_items.length > 0 && (
                    <div>
                      <h4 style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: '600', 
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>
                        Items:
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {group.modifier_items.map(item => (
                          <div key={item.id} style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            fontSize: '0.75rem',
                            color: '#6b7280'
                          }}>
                            <span>{item.name}</span>
                            <span>${item.price.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Business Settings Tab */}
        {activeTab === 'settings' && (
          <div>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              color: '#374151',
              marginBottom: '2rem'
            }}>
              Business Settings
            </h2>
            <div style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
              <p style={{ color: '#6b7280' }}>
                Business settings management will be implemented here.
              </p>
            </div>
          </div>
        )}

        {/* Printer Settings Tab */}
        {activeTab === 'printer' && (
          <div>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              color: '#374151',
              marginBottom: '2rem'
            }}>
              Printer Settings
            </h2>
            <div style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
              <p style={{ color: '#6b7280' }}>
                Printer configuration and test printing will be implemented here.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Menu Item Modal */}
      {showMenuItemModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 60
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            maxWidth: '32rem',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ padding: '2rem' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#374151' }}>
                  {editingMenuItem ? 'Edit Menu Item' : 'Add Menu Item'}
                </h3>
                <button
                  onClick={closeMenuItemModal}
                  style={{
                    color: '#6b7280',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.25rem'
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: '500', 
                    color: '#374151',
                    marginBottom: '0.25rem'
                  }}>
                    Name
                  </label>
                  <input
                    type="text"
                    value={menuItemForm.name}
                    onChange={(e) => setMenuItemForm({ ...menuItemForm, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.25rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: '500', 
                    color: '#374151',
                    marginBottom: '0.25rem'
                  }}>
                    Description
                  </label>
                  <textarea
                    value={menuItemForm.description}
                    onChange={(e) => setMenuItemForm({ ...menuItemForm, description: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.25rem',
                      minHeight: '4rem',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: '500', 
                    color: '#374151',
                    marginBottom: '0.25rem'
                  }}>
                    Category
                  </label>
                  <select
                    value={menuItemForm.category}
                    onChange={(e) => setMenuItemForm({ ...menuItemForm, category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.25rem'
                    }}
                  >
                    <option value="burgers">Burgers</option>
                    <option value="chicken">Chicken</option>
                    <option value="phillys">Phillys</option>
                  </select>
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: '500', 
                    color: '#374151',
                    marginBottom: '0.25rem'
                  }}>
                    Base Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={menuItemForm.base_price}
                    onChange={(e) => setMenuItemForm({ ...menuItemForm, base_price: parseFloat(e.target.value) || 0 })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.25rem'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="is_available"
                    checked={menuItemForm.is_available}
                    onChange={(e) => setMenuItemForm({ ...menuItemForm, is_available: e.target.checked })}
                    style={{ marginRight: '0.25rem' }}
                  />
                  <label htmlFor="is_available" style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: '500', 
                    color: '#374151'
                  }}>
                    Available for ordering
                  </label>
                </div>

                <div style={{ 
                  display: 'flex', 
                  gap: '1rem', 
                  justifyContent: 'flex-end',
                  marginTop: '1rem'
                }}>
                  <button
                    onClick={closeMenuItemModal}
                    style={{
                      padding: '0.5rem 1rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.25rem',
                      background: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveMenuItem}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.25rem',
                      cursor: 'pointer'
                    }}
                  >
                    {editingMenuItem ? 'Update' : 'Create'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modifier Group Modal */}
      {showModifierGroupModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 60
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            maxWidth: '32rem',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ padding: '2rem' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#374151' }}>
                  {editingModifierGroup ? 'Edit Modifier Group' : 'Add Modifier Group'}
                </h3>
                <button
                  onClick={closeModifierGroupModal}
                  style={{
                    color: '#6b7280',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.25rem'
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: '500', 
                    color: '#374151',
                    marginBottom: '0.25rem'
                  }}>
                    Name
                  </label>
                  <input
                    type="text"
                    value={modifierGroupForm.name}
                    onChange={(e) => setModifierGroupForm({ ...modifierGroupForm, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.25rem'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="is_required"
                    checked={modifierGroupForm.is_required}
                    onChange={(e) => setModifierGroupForm({ ...modifierGroupForm, is_required: e.target.checked })}
                    style={{ marginRight: '0.25rem' }}
                  />
                  <label htmlFor="is_required" style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: '500', 
                    color: '#374151'
                  }}>
                    Required selection
                  </label>
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: '500', 
                    color: '#374151',
                    marginBottom: '0.25rem'
                  }}>
                    Minimum Selections
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={modifierGroupForm.min_selections}
                    onChange={(e) => setModifierGroupForm({ ...modifierGroupForm, min_selections: parseInt(e.target.value) || 0 })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.25rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: '500', 
                    color: '#374151',
                    marginBottom: '0.25rem'
                  }}>
                    Maximum Selections
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={modifierGroupForm.max_selections}
                    onChange={(e) => setModifierGroupForm({ ...modifierGroupForm, max_selections: parseInt(e.target.value) || 1 })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.25rem'
                    }}
                  />
                </div>

                <div style={{ 
                  display: 'flex', 
                  gap: '1rem', 
                  justifyContent: 'flex-end',
                  marginTop: '1rem'
                }}>
                  <button
                    onClick={closeModifierGroupModal}
                    style={{
                      padding: '0.5rem 1rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.25rem',
                      background: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveModifierGroup}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.25rem',
                      cursor: 'pointer'
                    }}
                  >
                    {editingModifierGroup ? 'Update' : 'Create'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && selectedOrder && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 60
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            maxWidth: '32rem',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#374151', marginBottom: '1.5rem' }}>
                Reject Order #{selectedOrder.id.slice(-8)}
              </h3>
              <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                Please select a reason for rejecting this order. The customer will be notified via SMS.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {REJECTION_REASONS.map(reason => (
                  <button
                    key={reason}
                    onClick={() => handleReject(selectedOrder, reason)}
                    style={{
                      padding: '1rem',
                      backgroundColor: '#fef2f2',
                      border: '2px solid #fecaca',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#fee2e2'
                      e.currentTarget.style.borderColor = '#fca5a5'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#fef2f2'
                      e.currentTarget.style.borderColor = '#fecaca'
                    }}
                  >
                    {reason}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                <button
                  onClick={() => {
                    setShowRejectionModal(false)
                    setSelectedOrder(null)
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.25rem',
                    background: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  )
} 