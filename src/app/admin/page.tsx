'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Save, X, Eye, EyeOff, Upload, Printer, Settings, ShoppingBag, Building } from 'lucide-react'

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
  const [activeTab, setActiveTab] = useState('menu')
  
  // Data states
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([])
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  
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
      setOrders(data.orders || [])
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    }
  }

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

  const updateOrderStatus = async (orderId: string, status: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_status: status })
      })
      
      if (response.ok) {
        await fetchOrders()
      } else {
        alert('Failed to update order status')
      }
    } catch (error) {
      console.error('Failed to update order status:', error)
      alert('Failed to update order status')
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

      {/* Navigation Tabs */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '0 1rem'
      }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '2rem' }}>
            {[
              { id: 'menu', label: 'Menu Items', icon: <ShoppingBag size={18} /> },
              { id: 'modifiers', label: 'Modifiers', icon: <Settings size={18} /> },
              { id: 'orders', label: 'Orders', icon: <ShoppingBag size={18} /> },
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

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              color: '#374151',
              marginBottom: '2rem'
            }}>
              Orders
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {orders.map(order => (
                <div
                  key={order.id}
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
                        Order #{order.id.slice(-8)}
                      </h3>
                      <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                        {order.customer_name} • {order.customer_phone}
                      </p>
                      <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ 
                        fontSize: '1.25rem', 
                        fontWeight: 'bold', 
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>
                        ${order.total_amount.toFixed(2)}
                      </div>
                      <select
                        value={order.order_status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          border: '1px solid #e5e7eb',
                          borderRadius: '0.25rem',
                          fontSize: '0.875rem'
                        }}
                      >
                        <option value="pending">Pending</option>
                        <option value="accepted">Accepted</option>
                        <option value="ready">Ready</option>
                        <option value="completed">Completed</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                  
                  {order.order_items && (
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
                        {order.order_items.map(item => (
                          <div key={item.id} style={{ 
                            fontSize: '0.875rem',
                            color: '#6b7280'
                          }}>
                            {item.quantity}x {item.menu_item_name}
                            {item.size_name && ` (${item.size_name})`}
                            {item.special_instructions && (
                              <span style={{ fontStyle: 'italic' }}>
                                {' '}- {item.special_instructions}
                              </span>
                            )}
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
    </div>
  )
} 