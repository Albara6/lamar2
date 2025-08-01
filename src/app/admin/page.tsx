'use client'

import React, { useState, useEffect, useRef } from 'react'
import type { JSX as JSXType } from 'react/jsx-runtime'
import { Plus, Edit, Trash2, Save, X, Eye, EyeOff, Upload, Printer, Settings, ShoppingBag, Building, Clock, CheckCircle, XCircle, RotateCcw } from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  description: string
  category_id: string
  image_url?: string
  image_storage_url?: string // New field for Supabase Storage URLs
  price: number
  is_available: boolean
  display_order: number
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
  menu_item_size_id?: string
  modifier_group_id: string
  modifier_groups?: ModifierGroup
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
  total: number
  payment_method: string
  payment_status: string
  status: string
  created_at: string
  order_items?: OrderItem[]
  notes?: string
  rejection_reason?: string
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

interface Category {
  id: string
  name: string
  display_order: number
  image_url?: string
  image_storage_url?: string // New field for Supabase Storage URLs
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
  
  // Days of week helper for business hours UI
  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
  
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
    category_id: '',
    price: 0,
    is_available: true,
    display_order: 0,
    image_url: '',
    image_storage_url: '' // New field for Supabase Storage URLs
  })
  
  const [modifierGroupForm, setModifierGroupForm] = useState({
    name: '',
    is_required: false,
    max_selections: 1,
    min_selections: 0,
    sort_order: 0
  })

  const [loading, setLoading] = useState(false)
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null)
  
  // Audio notification system
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlayingSound, setIsPlayingSound] = useState(false)

  // Initialize audio on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/notification.mp3')
      // Repeat the alert until every pending order has been actioned
      audioRef.current.loop = true
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
      // Ensure looping is enabled every time just in case
      audioRef.current.loop = true
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

  // Poll orders every 3 seconds for faster real-time updates
  useEffect(() => {
    if (!authenticated) return
    
    const interval = setInterval(() => {
      fetchOrders()
    }, 3000)
    
    return () => clearInterval(interval)
  }, [authenticated])

  // Sound alert for new pending orders (stable version)
  useEffect(() => {
    const newOrders = orders.filter(o => 
      o.status === 'pending' && 
      (o.payment_status === 'paid' || o.payment_method === 'cash')
    )
    
    if (newOrders.length > 0) {
      if (!isPlayingSound) {
        setIsPlayingSound(true)
        playNotificationSound()
      }
    } else {
      if (isPlayingSound) {
        setIsPlayingSound(false)
      }
      // Pause any playing audio when there are no pending orders
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [orders, isPlayingSound]) // Re-run whenever order list updates

  // Stop audio when we explicitly update isPlayingSound to false elsewhere
  useEffect(() => {
    if (!isPlayingSound && audioRef.current) {
      audioRef.current.pause()
    }
  }, [isPlayingSound])

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
        fetchCategories(),
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
      // Add timestamp to prevent any caching
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/admin/menu-items?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
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
      // Add timestamp to prevent any caching
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/admin/orders?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      const data = await response.json()
      const allOrders = data.orders || []
      
      // Separate active orders from history using status
      const activeOrders = allOrders.filter((order: Order) => 
        order.status === 'pending' || order.status === 'accepted'
      )
      const historyOrders = allOrders.filter((order: Order) => 
        order.status === 'ready' || order.status === 'completed' || order.status === 'rejected'
      ).slice(0, 100)
      
      setOrders(activeOrders)
      setOrderHistory(historyOrders)
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    }
  }

  // Accept order - change to accepted status and auto-print receipt
  const handleAccept = async (order: Order) => {
    try {
      // Accept order without altering payment_status so unpaid cash orders remain "NOT PAID"
      const updateData = { status: 'accepted' }

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
    
    const subtotal = (order.order_items || []).reduce((sum, itm) => sum + (itm.total_price ?? 0), 0)
    const total = order.total ?? 0
    const tax = Math.max(total - subtotal, 0)
    
    const receiptHTML = `
      <html>
        <head>
          <title>Receipt - Order #${order.id.slice(-8)}</title>
          <style>
            /* Thermal printer-friendly styling */
            @page { size: 80mm auto; margin: 0mm; }
            @media print {
              body { width: 80mm; margin: 0; }
            }
            body { font-family: 'Courier New', monospace; font-size: 18px; font-weight: bold; margin: 0; padding: 4mm; }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 8px; }
            .order-details { margin: 10px 0; }
            .item { margin: 4px 0; display: flex; justify-content: space-between; }
            .total { border-top: 1px dashed #000; padding-top: 6px; font-weight: bold; }
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
            <p>
              <strong>Payment:</strong> ${order.payment_method === 'cash' ? 
                `CASH - ${order.payment_status.toUpperCase() === 'PAID' ? 'PAID ✓' : 'NOT PAID ✗'}` : 
                `${order.payment_method.toUpperCase()} - ${order.payment_status.toUpperCase()}`}
            </p>
            ${order.notes ? `<p><strong>Notes:</strong> ${order.notes}</p>` : ''}
          </div>
          <div class="items">
            ${order.order_items?.map(item => `
              <div class="item">
                <span>${item.quantity}x ${item.menu_item_name}${item.size_name ? ` (${item.size_name})` : ''}</span>
                <span>$${(item.total_price ?? 0).toFixed(2)}</span>
              </div>
              ${item.order_item_modifiers?.map(mod => `
                <div style="margin-left: 20px; color: #666;">
                  <span>+ ${mod.modifier_name}</span>
                  <span>$${(mod.price ?? 0).toFixed(2)}</span>
                </div>
              `).join('') || ''}
              ${item.special_instructions ? `<div style="margin-left: 20px; font-style: italic; color: #666666;">Note: ${item.special_instructions}</div>` : ''}
            `).join('') || ''}
          </div>
          <div class="total">
            <div class="item" style="font-size:20px;">
              <span>SUBTOTAL:</span>
              <span>$${subtotal.toFixed(2)}</span>
            </div>
            <div class="item" style="font-size:20px;">
              <span>TAX:</span>
              <span>$${tax.toFixed(2)}</span>
            </div>
            <div class="item" style="font-size:22px;">
              <span>TOTAL:</span>
              <span>$${total.toFixed(2)}</span>
            </div>
          </div>
        </body>
      </html>
    `
    
    win.document.write(receiptHTML)
    win.document.close()
    win.focus()
    win.print()
    // Give browser a moment to start printing before closing
    setTimeout(() => win.close(), 500)
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
        category_id: item.category_id,
        price: item.price,
        is_available: item.is_available,
        display_order: item.display_order,
        image_url: item.image_url || '',
        image_storage_url: item.image_storage_url || ''
      })
    } else {
      setEditingMenuItem(null)
              setMenuItemForm({
          name: '',
          description: '',
          category_id: '',
          price: 0,
          is_available: true,
          display_order: 0,
          image_url: '',
          image_storage_url: ''
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

  // Category management functions
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories')
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const saveCategory = async () => {
    setLoading(true)
    try {
      const method = editingCategory ? 'PUT' : 'POST'
      const categoryData = {
        ...categoryForm,
        id: editingCategory ? editingCategory.id : categoryForm.name.toLowerCase().replace(/[^a-z0-9]/g, '')
      }

      // Helper to actually call the API
      const doSave = async () => {
        const resp = await fetch('/api/admin/categories', {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(categoryData)
        })
        return resp
      }

      let response = await doSave()

      // If the image_url column doesn't exist yet, run migration automatically and retry once
      if (!response.ok) {
        try {
          const err = await response.json()
          if (err.message?.includes('image_url')) {
            // Run migration silently
            await fetch('/api/admin/migrate-categories', { method: 'POST' })
            // Retry save one more time
            response = await doSave()
          }
        } catch (_) {
          /* swallow json parse errors */
        }
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.message || 'Failed to save category')
      }

      await fetchCategories()
      closeCategoryModal()
    } catch (error) {
      console.error('Failed to save category:', error)
      alert(error instanceof Error ? error.message : 'Failed to save category')
    }
    setLoading(false)
  }

  const deleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return
    setLoading(true)
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      if (!response.ok) throw new Error('Failed to delete category')
      await fetchCategories()
    } catch (error) {
      alert('Failed to delete category')
      console.error(error)
    }
    setLoading(false)
  }

  const openCategoryModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setCategoryForm({
        id: category.id,
        name: category.name,
        display_order: category.display_order,
        image_url: category.image_url || '',
        image_storage_url: category.image_storage_url || ''
      })
      // Set the existing image as preview when editing
      setSelectedCategoryImagePreview(category.image_url || null)
    } else {
      setEditingCategory(null)
      setCategoryForm({
        id: '',
        name: '',
        display_order: categories.length,
        image_url: '',
        image_storage_url: ''
      })
      setSelectedCategoryImagePreview(null)
    }
    setShowCategoryModal(true)
  }

  // On mount and after auth, fetch categories
  useEffect(() => {
    if (authenticated) {
      fetchCategories()
    }
  }, [authenticated])

  const closeCategoryModal = () => {
    setShowCategoryModal(false)
    setEditingCategory(null)
    setCategoryForm({
      id: '',
      name: '',
      display_order: 0,
      image_url: '',
      image_storage_url: ''
    })
  }

  // Size management functions
  const fetchSizes = async (menuItemId: string) => {
    try {
      const response = await fetch(`/api/admin/menu-items/${menuItemId}/sizes`)
      const data = await response.json()
      return data.sizes || []
    } catch (error) {
      console.error('Failed to fetch sizes:', error)
      return []
    }
  }

  const saveSize = async () => {
    if (!selectedMenuItemForSizes) return
    setLoading(true)
    try {
      const url = editingSize 
        ? `/api/admin/menu-items/${selectedMenuItemForSizes.id}/sizes/${editingSize.id}`
        : `/api/admin/menu-items/${selectedMenuItemForSizes.id}/sizes`
      
      const response = await fetch(url, {
        method: editingSize ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sizeForm)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save size')
      }
      
      const sizes = await fetchSizes(selectedMenuItemForSizes.id)
      setMenuItems(prev => prev.map(item => 
        item.id === selectedMenuItemForSizes.id 
          ? { ...item, menu_item_sizes: sizes }
          : item
      ))
      closeSizeModal()
    } catch (error) {
      console.error('Failed to save size:', error)
      alert(error instanceof Error ? error.message : 'Failed to save size')
    }
    setLoading(false)
  }

  const deleteSize = async (menuItemId: string, sizeId: string) => {
    if (!confirm('Are you sure you want to delete this size?')) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/menu-items/${menuItemId}/sizes/${sizeId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete size')
      }
      
      const sizes = await fetchSizes(menuItemId)
      setMenuItems(prev => prev.map(item => 
        item.id === menuItemId 
          ? { ...item, menu_item_sizes: sizes }
          : item
      ))
    } catch (error) {
      console.error('Failed to delete size:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete size')
    }
    setLoading(false)
  }

  const openSizeModal = (menuItem: MenuItem, size?: MenuItemSize) => {
    setSelectedMenuItemForSizes(menuItem)
    if (size) {
      setEditingSize(size)
      setSizeForm({
        name: size.name,
        price_modifier: size.price_modifier,
        is_default: size.is_default,
        sort_order: size.sort_order
      })
    } else {
      setEditingSize(null)
      setSizeForm({
        name: '',
        price_modifier: 0,
        is_default: false,
        sort_order: (menuItem.menu_item_sizes?.length || 0)
      })
    }
    setShowSizeModal(true)
  }

  const closeSizeModal = () => {
    setShowSizeModal(false)
    setEditingSize(null)
    setSelectedMenuItemForSizes(null)
    setSizeForm({
      name: '',
      price_modifier: 0,
      is_default: false,
      sort_order: 0
    })
  }

  // Modifier item management functions  
  const fetchModifierItems = async (groupId: string) => {
    try {
      const response = await fetch(`/api/admin/modifier-groups/${groupId}/items`)
      const data = await response.json()
      return data.modifierItems || []
    } catch (error) {
      console.error('Failed to fetch modifier items:', error)
      return []
    }
  }

  const saveModifierItem = async () => {
    if (!selectedModifierGroupForItems) return
    setLoading(true)
    try {
      const url = editingModifierItem 
        ? `/api/admin/modifier-groups/${selectedModifierGroupForItems.id}/items/${editingModifierItem.id}`
        : `/api/admin/modifier-groups/${selectedModifierGroupForItems.id}/items`
      
      const response = await fetch(url, {
        method: editingModifierItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modifierItemForm)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save modifier item')
      }
      
      const items = await fetchModifierItems(selectedModifierGroupForItems.id)
      setModifierGroups(prev => prev.map(group => 
        group.id === selectedModifierGroupForItems.id 
          ? { ...group, modifier_items: items }
          : group
      ))
      closeModifierItemModal()
    } catch (error) {
      console.error('Failed to save modifier item:', error)
      alert(error instanceof Error ? error.message : 'Failed to save modifier item')
    }
    setLoading(false)
  }

  const deleteModifierItem = async (groupId: string, itemId: string) => {
    if (!confirm('Are you sure you want to delete this modifier item?')) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/modifier-groups/${groupId}/items/${itemId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete modifier item')
      }
      
      const items = await fetchModifierItems(groupId)
      setModifierGroups(prev => prev.map(group => 
        group.id === groupId 
          ? { ...group, modifier_items: items }
          : group
      ))
    } catch (error) {
      console.error('Failed to delete modifier item:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete modifier item')
    }
    setLoading(false)
  }

  const openModifierItemModal = (group: ModifierGroup, item?: ModifierItem) => {
    setSelectedModifierGroupForItems(group)
    if (item) {
      setEditingModifierItem(item)
      setModifierItemForm({
        name: item.name,
        price: item.price,
        is_default: item.is_default,
        sort_order: item.sort_order
      })
    } else {
      setEditingModifierItem(null)
      setModifierItemForm({
        name: '',
        price: 0,
        is_default: false,
        sort_order: (group.modifier_items?.length || 0)
      })
    }
    setShowModifierItemModal(true)
  }

  const closeModifierItemModal = () => {
    setShowModifierItemModal(false)
    setEditingModifierItem(null)
    setSelectedModifierGroupForItems(null)
    setModifierItemForm({
      name: '',
      price: 0,
      is_default: false,
      sort_order: 0
    })
  }

  const saveBusinessSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/business-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(businessSettings)
      })

      if (response.ok) {
        await fetchBusinessSettings()
        alert('Business settings updated successfully!')
      } else {
        const errorData = await response.json()
        alert(`Failed to update business settings: ${errorData.message || response.statusText}`)
      }
    } catch (error) {
      console.error('Failed to save business settings:', error)
      alert('Failed to save business settings')
    }
    setLoading(false)
  }

  const printTestReceipt = () => {
    const win = window.open('', '_blank', 'width=400,height=600')
    if (!win) return
    
    const testReceiptHTML = `
      <html>
        <head>
          <title>Test Receipt - Crazy Chicken</title>
          <style>
            body { font-family: 'Courier New', monospace; font-size: 12px; margin: 20px; }
            .header { text-align: center; border-bottom: 1px solid #000; padding-bottom: 10px; }
            .test-info { margin: 20px 0; text-align: center; }
            .item { margin: 5px 0; display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>🍗 CRAZY CHICKEN</h2>
            <p>TEST RECEIPT</p>
            <p>${new Date().toLocaleString()}</p>
          </div>
          <div class="test-info">
            <p><strong>PRINTER TEST</strong></p>
            <p>If you can read this clearly,</p>
            <p>your printer is working correctly!</p>
          </div>
          <div class="items">
            <div class="item">
              <span>1x Test Item</span>
              <span>$0.00</span>
            </div>
          </div>
          <div style="border-top: 1px solid #000; padding-top: 10px; font-weight: bold; text-align: center;">
            <p>TOTAL: $0.00</p>
            <p>Thank you for using Crazy Chicken!</p>
          </div>
        </body>
      </html>
    `
    
    win.document.write(testReceiptHTML)
    win.document.close()
    win.focus()
    win.print()
    win.close()
  }

  // Function to compress image before upload
  const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()
      
      img.onload = () => {
        // Calculate new dimensions
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
        canvas.width = img.width * ratio
        canvas.height = img.height * ratio
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        canvas.toBlob((blob) => {
          const compressedFile = new File([blob!], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          })
          resolve(compressedFile)
        }, 'image/jpeg', quality)
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    setLoading(true)
    
    try {
      // Show preview immediately for better UX
      const previewUrl = URL.createObjectURL(file)
      setSelectedImagePreview(previewUrl)
      
      // Compress the image
      console.log(`Original size: ${(file.size / 1024 / 1024).toFixed(2)}MB`)
      const compressedFile = await compressImage(file, 800, 0.8)
      console.log(`Compressed size: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`)
      
      // Upload to Supabase Storage
      const formData = new FormData()
      formData.append('file', compressedFile)
      formData.append('type', 'menu-item')
      
      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }
      
      const data = await response.json()
      
      // Update form with storage URL (prioritize new system)
      setMenuItemForm({
        ...menuItemForm,
        image_storage_url: data.url,
        image_url: '' // Clear old Base64 field
      })
      
      console.log('Image uploaded successfully:', data.url)
      
    } catch (error) {
      console.error('Upload error:', error)
      alert(error instanceof Error ? error.message : 'Failed to upload image')
      // Reset preview on error
      setSelectedImagePreview(null)
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    setLoading(true)
    
    try {
      // Show preview immediately for better UX
      const previewUrl = URL.createObjectURL(file)
      setSelectedCategoryImagePreview(previewUrl)
      
      // Compress the image
      console.log(`Original category image size: ${(file.size / 1024 / 1024).toFixed(2)}MB`)
      const compressedFile = await compressImage(file, 800, 0.8)
      console.log(`Compressed category image size: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`)
      
      // Upload to Supabase Storage
      const formData = new FormData()
      formData.append('file', compressedFile)
      formData.append('type', 'category')
      
      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }
      
      const data = await response.json()
      
      // Update form with storage URL (prioritize new system)
      setCategoryForm({
        ...categoryForm,
        image_storage_url: data.url,
        image_url: '' // Clear old Base64 field
      })
      
      console.log('Category image uploaded successfully:', data.url)
      
    } catch (error) {
      console.error('Category upload error:', error)
      alert(error instanceof Error ? error.message : 'Failed to upload category image')
      // Reset preview on error
      setSelectedCategoryImagePreview(null)
    } finally {
      setLoading(false)
    }
  }

  // Add new state variables after existing form states (around line 137)
  const [categories, setCategories] = useState<Category[]>([])
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showSizeModal, setShowSizeModal] = useState(false)
  const [showModifierItemModal, setShowModifierItemModal] = useState(false)
  const [showModifierGroupAssignModal, setShowModifierGroupAssignModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingSize, setEditingSize] = useState<MenuItemSize | null>(null)
  const [editingModifierItem, setEditingModifierItem] = useState<ModifierItem | null>(null)
  const [selectedMenuItemForSizes, setSelectedMenuItemForSizes] = useState<MenuItem | null>(null)
  const [selectedMenuItemForModifiers, setSelectedMenuItemForModifiers] = useState<MenuItem | null>(null)
  const [selectedModifierGroupForItems, setSelectedModifierGroupForItems] = useState<ModifierGroup | null>(null)
  const [selectedSizeForModifiers, setSelectedSizeForModifiers] = useState<MenuItemSize | null>(null)
  const [isAllSizesSelected, setIsAllSizesSelected] = useState(false)
  
  // Form states for new features
  const [categoryForm, setCategoryForm] = useState({
    id: '',
    name: '',
    display_order: 0,
    image_url: '',
    image_storage_url: '' // New field for Supabase Storage URLs
  })
  
  const [sizeForm, setSizeForm] = useState({
    name: '',
    price_modifier: 0,
    is_default: false,
    sort_order: 0
  })
  
  const [modifierItemForm, setModifierItemForm] = useState({
    name: '',
    price: 0,
    is_default: false,
    sort_order: 0
  })
  
  // Enhanced menu item form to include sizes and modifier groups
  const [menuItemSizes, setMenuItemSizes] = useState<MenuItemSize[]>([])
  const [selectedModifierGroups, setSelectedModifierGroups] = useState<string[]>([])

  // Add category image upload states
  const [selectedCategoryImageFile, setSelectedCategoryImageFile] = useState<File | null>(null)
  const [selectedCategoryImagePreview, setSelectedCategoryImagePreview] = useState<string | null>(null)

  // Place fetchMenuItemModifierGroups above removeModifierGroup
  const fetchMenuItemModifierGroups = async (menuItemId: string) => {
    try {
      const response = await fetch(`/api/admin/menu-items/${menuItemId}/modifier-groups`)
      const data = await response.json()
      return data.menuItemModifierGroups || []
    } catch (error) {
      console.error('Failed to fetch menu item modifier groups:', error)
      return []
    }
  }

  const removeModifierGroup = async (menuItemId: string, modifierGroupId: string, sizeId?: string) => {
    if (!confirm('Are you sure you want to remove this modifier group?')) return;
    
    setLoading(true);
    try {
      const requestBody = {
        modifier_group_id: modifierGroupId,
        menu_item_size_id: sizeId && sizeId !== 'null' && sizeId !== 'undefined' ? sizeId : null
      };
      
      const response = await fetch(`/api/admin/menu-items/${menuItemId}/modifier-groups`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove modifier group');
      }
      
      const menuItemModifierGroups = await fetchMenuItemModifierGroups(menuItemId);
      setMenuItems(prev => prev.map(item =>
        item.id === menuItemId
          ? { ...item, menu_item_modifier_groups: menuItemModifierGroups }
          : item
      ));
      
    } catch (error) {
      console.error('Failed to remove modifier group:', error);
      alert(error instanceof Error ? error.message : 'Failed to remove modifier group from menu item');
    }
    setLoading(false);
  }

  const openModifierGroupAssignModal = (menuItem: MenuItem, size?: MenuItemSize) => {
    setSelectedMenuItemForModifiers(menuItem)
    setSelectedSizeForModifiers(size || null)
    setIsAllSizesSelected(!size) // If no size provided, default to "all sizes"
    setShowModifierGroupAssignModal(true)
  }

  const closeModifierGroupAssignModal = () => {
    setShowModifierGroupAssignModal(false)
    setSelectedMenuItemForModifiers(null)
    setSelectedSizeForModifiers(null)
    setIsAllSizesSelected(false)
  }

  const assignModifierGroup = async (menuItemId: string, modifierGroupId: string, sizeId?: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/menu-items/${menuItemId}/modifier-groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modifier_group_id: modifierGroupId,
          menu_item_size_id: sizeId === 'all' ? 'all' : sizeId
        })
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to assign modifier group')
      }
      const menuItemModifierGroups = await fetchMenuItemModifierGroups(menuItemId)
      setMenuItems(prev => prev.map(item =>
        item.id === menuItemId
          ? { ...item, menu_item_modifier_groups: menuItemModifierGroups }
          : item
      ))
      closeModifierGroupAssignModal()
    } catch (error) {
      console.error('Failed to assign modifier group:', error)
      alert(error instanceof Error ? error.message : 'Failed to assign modifier group')
    }
    setLoading(false)
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
              🍗 {businessSettings?.name || 'Crazy Chicken'} Admin Panel
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
              { id: 'categories', label: 'Categories', icon: <Building size={18} /> },
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

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '2rem'
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#374151' }}>
                Menu Categories
              </h2>
              <button
                onClick={() => openCategoryModal()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                <Plus size={20} />
                Add Category
              </button>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              {categories.map(category => (
                <div
                  key={category.id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flex: 1 }}>
                      {category.image_url && (
                        <img 
                          src={category.image_url} 
                          alt={category.name}
                          style={{
                            width: '60px',
                            height: '60px',
                            objectFit: 'cover',
                            borderRadius: '0.5rem',
                            border: '1px solid #e5e7eb'
                          }}
                        />
                      )}
                      <div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151' }}>
                          {category.name}
                        </h3>
                        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                          Display Order: {category.display_order}
                        </p>
                        <p style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                          ID: {category.id}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => openCategoryModal(category)}
                        style={{
                          padding: '0.5rem',
                          backgroundColor: '#f3f4f6',
                          border: 'none',
                          borderRadius: '0.375rem',
                          cursor: 'pointer'
                        }}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => deleteCategory(category.id)}
                        style={{
                          padding: '0.5rem',
                          backgroundColor: '#fee2e2',
                          border: 'none',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          color: '#dc2626'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
                 Auto-refresh every 3 seconds
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
                                             border: order.status === 'pending' && 
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
                                                     {order.status === 'pending' && 
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
                            💳 {order.payment_method.toUpperCase() === 'CASH' ? 
                              `CASH - ${order.payment_status.toUpperCase() === 'PAID' ? '✅ PAID' : '❌ NOT PAID'}` : 
                              `${order.payment_method.toUpperCase()} - ${order.payment_status.toUpperCase()}`}
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
                          ${(order.total ?? 0).toFixed(2)}
                        </div>
                        <div style={{ 
                          padding: '0.5rem 1rem',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          backgroundColor: order.status === 'pending' ? '#fef3c7' : 
                                         order.status === 'accepted' ? '#dbeafe' : '#d1fae5',
                          color: order.status === 'pending' ? '#92400e' : 
                               order.status === 'accepted' ? '#1e40af' : '#065f46'
                        }}>
                          {order.status === 'pending' ? 'PENDING' :
                           order.status === 'accepted' ? 'ACCEPTED' :
                           order.status.toUpperCase()}
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
                                  ${(item.total_price ?? 0).toFixed(2)}
                                </span>
                              </div>
                              
                              {/* Modifiers */}
                              {item.order_item_modifiers?.map(mod => (
                                <div key={mod.id} style={{ marginLeft: '20px', color: '#666666', fontSize: '0.875rem' }}>
                                  <span>+ {mod.modifier_name}</span>
                                  <span style={{ marginLeft: '0.5rem', fontWeight: '500' }}>
                                    ${(mod.price ?? 0).toFixed(2)}
                                  </span>
                                </div>
                              ))}
                              
                              {item.special_instructions && (
                                <div style={{ marginLeft: '20px', fontStyle: 'italic', color: '#666666', fontSize: '0.875rem' }}>
                                  Note: {item.special_instructions}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Order Special Instructions */}
                    {order.notes && (
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
                          {order.notes}
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
                       {order.status === 'pending' && 
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
                             ACCEPT ORDER
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
                       
                       {order.status === 'accepted' && (
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
                        order.status === 'delivered' ? '#d1fae5' :
                        order.status === 'rejected' ? '#fee2e2' : '#e5e7eb'
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
                            ${(order.total ?? 0).toFixed(2)}
                          </div>
                          <div style={{ 
                            padding: '0.25rem 0.75rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            backgroundColor: 
                              order.status === 'delivered' ? '#d1fae5' :
                              order.status === 'rejected' ? '#fee2e2' : '#f3f4f6',
                            color: 
                              order.status === 'delivered' ? '#065f46' :
                              order.status === 'rejected' ? '#991b1b' : '#374151'
                          }}>
                            {order.status.toUpperCase()}
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
                    alignItems: 'center',
                    marginBottom: '1rem' 
                  }}>
                    <span style={{ 
                      fontSize: '1.25rem', 
                      fontWeight: 'bold', 
                      color: '#dc2626' 
                    }}>
                      ${(item.price ?? 0).toFixed(2)}
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
                      {item.category_id}
                    </span>
                  </div>

                  {/* Sizes */}
                  {item.menu_item_sizes && item.menu_item_sizes.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '0.5rem'
                      }}>
                        <h4 style={{ 
                          fontSize: '0.875rem', 
                          fontWeight: '600', 
                          color: '#374151'
                        }}>
                          Sizes:
                        </h4>
                        <button
                          onClick={() => openSizeModal(item)}
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#dbeafe',
                            color: '#1e40af',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: 'pointer'
                          }}
                        >
                          + Add Size
                        </button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {item.menu_item_sizes.map(size => (
                          <div key={size.id} style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.75rem',
                            color: '#6b7280'
                          }}>
                            <span>{size.name} {size.is_default && '(Default)'}</span>
                            <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                              <span>+${size.price_modifier.toFixed(2)}</span>
                              <button
                                onClick={() => openSizeModal(item, size)}
                                style={{
                                  padding: '0.25rem',
                                  backgroundColor: '#f3f4f6',
                                  border: 'none',
                                  borderRadius: '0.125rem',
                                  cursor: 'pointer'
                                }}
                              >
                                <Edit size={12} />
                              </button>
                              <button
                                onClick={() => deleteSize(item.id, size.id)}
                                style={{
                                  padding: '0.25rem',
                                  backgroundColor: '#fef2f2',
                                  color: '#ef4444',
                                  border: 'none',
                                  borderRadius: '0.125rem',
                                  cursor: 'pointer'
                                }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Modifier Groups */}
                  <div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '0.5rem'
                    }}>
                      <h4 style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: '600', 
                        color: '#374151'
                      }}>
                        Modifier Groups:
                      </h4>
                      <button
                        onClick={() => openModifierGroupAssignModal(item)}
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#d1fae5',
                          color: '#065f46',
                          border: 'none',
                          borderRadius: '0.25rem',
                          cursor: 'pointer'
                        }}
                      >
                        + Assign Group
                      </button>
                    </div>
                    {item.menu_item_modifier_groups && item.menu_item_modifier_groups.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {item.menu_item_modifier_groups.map(modGroup => (
                          <div key={modGroup.id} style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.75rem',
                            color: '#6b7280'
                          }}>
                            <span>
                              {modGroup.modifier_groups?.name || 'Unknown Group'}
                              {modGroup.menu_item_size_id 
                                ? ` (${item.menu_item_sizes?.find(s => s.id === modGroup.menu_item_size_id)?.name || 'Unknown size'})`
                                : ' (🌟 All sizes)'
                              }
                            </span>
                            <button
                              onClick={() => removeModifierGroup(item.id, modGroup.modifier_group_id, modGroup.menu_item_size_id)}
                              style={{
                                padding: '0.25rem',
                                backgroundColor: '#fef2f2',
                                color: '#ef4444',
                                border: 'none',
                                borderRadius: '0.125rem',
                                cursor: 'pointer'
                              }}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ 
                        fontSize: '0.75rem', 
                        color: '#9ca3af',
                        fontStyle: 'italic'
                      }}>
                        No modifier groups assigned
                      </p>
                    )}
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
                  
                  <div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '0.5rem'
                    }}>
                      <h4 style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: '600', 
                        color: '#374151'
                      }}>
                        Modifier Items:
                      </h4>
                      <button
                        onClick={() => openModifierItemModal(group)}
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#dbeafe',
                          color: '#1e40af',
                          border: 'none',
                          borderRadius: '0.25rem',
                          cursor: 'pointer'
                        }}
                      >
                        + Add Item
                      </button>
                    </div>
                    {group.modifier_items && group.modifier_items.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {group.modifier_items.map(item => (
                          <div key={item.id} style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.75rem',
                            color: '#6b7280'
                          }}>
                            <span>{item.name} {item.is_default && '(Default)'}</span>
                            <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                              <span>${(item.price ?? 0).toFixed(2)}</span>
                              <button
                                onClick={() => openModifierItemModal(group, item)}
                                style={{
                                  padding: '0.25rem',
                                  backgroundColor: '#f3f4f6',
                                  border: 'none',
                                  borderRadius: '0.125rem',
                                  cursor: 'pointer'
                                }}
                              >
                                <Edit size={12} />
                              </button>
                              <button
                                onClick={() => deleteModifierItem(group.id, item.id)}
                                style={{
                                  padding: '0.25rem',
                                  backgroundColor: '#fef2f2',
                                  color: '#ef4444',
                                  border: 'none',
                                  borderRadius: '0.125rem',
                                  cursor: 'pointer'
                                }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ 
                        fontSize: '0.75rem', 
                        color: '#9ca3af',
                        fontStyle: 'italic'
                      }}>
                        No modifier items added yet
                      </p>
                    )}
                  </div>
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
            {businessSettings ? (
              <div style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '0.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Restaurant Name */}
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '0.875rem', 
                      fontWeight: '500', 
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Restaurant Name
                    </label>
                    <input
                      type="text"
                      value={businessSettings.name}
                      onChange={(e) => setBusinessSettings({ ...businessSettings, name: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.5rem',
                        fontSize: '1rem'
                      }}
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '0.875rem', 
                      fontWeight: '500', 
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={businessSettings.phone}
                      onChange={(e) => setBusinessSettings({ ...businessSettings, phone: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.5rem',
                        fontSize: '1rem'
                      }}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '0.875rem', 
                      fontWeight: '500', 
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={businessSettings.email}
                      onChange={(e) => setBusinessSettings({ ...businessSettings, email: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.5rem',
                        fontSize: '1rem'
                      }}
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '0.875rem', 
                      fontWeight: '500', 
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Address
                    </label>
                    <textarea
                      value={businessSettings.address}
                      onChange={(e) => setBusinessSettings({ ...businessSettings, address: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.5rem',
                        fontSize: '1rem',
                        minHeight: '4rem',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* Banner Settings */}
                  <div style={{
                    padding: '1.5rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '0.5rem',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h3 style={{ 
                      fontSize: '1.125rem', 
                      fontWeight: '600', 
                      color: '#374151',
                      marginBottom: '1rem'
                    }}>
                      Banner Settings
                    </h3>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                      <input
                        type="checkbox"
                        id="banner_enabled"
                        checked={businessSettings.banner_enabled}
                        onChange={(e) => setBusinessSettings({ ...businessSettings, banner_enabled: e.target.checked })}
                        style={{ marginRight: '0.25rem' }}
                      />
                      <label htmlFor="banner_enabled" style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: '500', 
                        color: '#374151'
                      }}>
                        Enable promotional banner
                      </label>
                    </div>

                    {businessSettings.banner_enabled && (
                      <div>
                        <label style={{ 
                          display: 'block', 
                          fontSize: '0.875rem', 
                          fontWeight: '500', 
                          color: '#374151',
                          marginBottom: '0.5rem'
                        }}>
                          Banner Text
                        </label>
                        <textarea
                          value={businessSettings.banner_text}
                          onChange={(e) => setBusinessSettings({ ...businessSettings, banner_text: e.target.value })}
                          placeholder="Enter promotional message..."
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.5rem',
                            fontSize: '1rem',
                            minHeight: '3rem',
                            resize: 'vertical'
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Order Status */}
                  <div style={{
                    padding: '1.5rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '0.5rem',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h3 style={{ 
                      fontSize: '1.125rem', 
                      fontWeight: '600', 
                      color: '#374151',
                      marginBottom: '1rem'
                    }}>
                      Order Management
                    </h3>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        id="is_accepting_orders"
                        checked={businessSettings.is_accepting_orders}
                        onChange={(e) => setBusinessSettings({ ...businessSettings, is_accepting_orders: e.target.checked })}
                        style={{ marginRight: '0.25rem' }}
                      />
                      <label htmlFor="is_accepting_orders" style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: '500', 
                        color: '#374151'
                      }}>
                        Currently accepting new orders
                      </label>
                    </div>
                    <p style={{ 
                      fontSize: '0.75rem', 
                      color: '#6b7280',
                      marginTop: '0.5rem'
                    }}>
                      When disabled, customers will see a message that orders are temporarily unavailable
                    </p>
                  </div>

                  {/* Business Hours */}
                  <div style={{
                    padding: '1.5rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '0.5rem',
                    border: '1px solid #e5e7eb',
                    marginTop: '1.5rem'
                  }}>
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '1rem'
                    }}>
                      Business Hours
                    </h3>

                    {daysOfWeek.map(day => {
                      const displayName = day.charAt(0).toUpperCase() + day.slice(1)
                      const dayHours = (businessSettings.hours && businessSettings.hours[day]) || { open: '', close: '', closed: false }
                      return (
                        <div key={day} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                          <label style={{ width: '6rem', fontWeight: 500, color: '#374151' }}>{displayName}</label>
                          <input
                            type="checkbox"
                            checked={dayHours.closed}
                            onChange={(e) => {
                              const updatedHours = { ...businessSettings.hours, [day]: { ...dayHours, closed: e.target.checked } }
                              setBusinessSettings({ ...businessSettings, hours: updatedHours })
                            }}
                          />
                          {!dayHours.closed && (
                            <React.Fragment>
                               <input
                                 type="time"
                                 value={dayHours.open}
                                 onChange={(e) => {
                                   const updatedHours = { ...businessSettings.hours, [day]: { ...dayHours, open: e.target.value } }
                                   setBusinessSettings({ ...businessSettings, hours: updatedHours })
                                 }}
                                 style={{ padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}
                               />
                               <span style={{ color: '#374151' }}>to</span>
                               <input
                                 type="time"
                                 value={dayHours.close}
                                 onChange={(e) => {
                                   const updatedHours = { ...businessSettings.hours, [day]: { ...dayHours, close: e.target.value } }
                                   setBusinessSettings({ ...businessSettings, hours: updatedHours })
                                 }}
                                 style={{ padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}
                               />
                            </React.Fragment>
                          )}
                        </div>
                      )
                    })}
                    <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      Toggle "Closed" to mark a day as fully closed.
                    </p>
                  </div>

                  {/* Save Button */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end',
                    marginTop: '1rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid #e5e7eb'
                  }}>
                    <button
                      onClick={saveBusinessSettings}
                      disabled={loading}
                      style={{
                        backgroundColor: '#dc2626',
                        color: 'white',
                        padding: '0.75rem 2rem',
                        borderRadius: '0.5rem',
                        border: 'none',
                        fontWeight: '600',
                        fontSize: '1rem',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.6 : 1
                      }}
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '0.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                textAlign: 'center',
                color: '#6b7280'
              }}>
                Loading business settings...
              </div>
            )}
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Auto Print Settings */}
                <div style={{
                  padding: '1.5rem',
                  backgroundColor: '#f9fafb',
                  borderRadius: '0.5rem',
                  border: '1px solid #e5e7eb'
                }}>
                  <h3 style={{ 
                    fontSize: '1.125rem', 
                    fontWeight: '600', 
                    color: '#374151',
                    marginBottom: '1rem'
                  }}>
                    Auto Print Settings
                  </h3>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <input
                      type="checkbox"
                      id="auto_print"
                      defaultChecked={true}
                      style={{ marginRight: '0.25rem' }}
                    />
                    <label htmlFor="auto_print" style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: '500', 
                      color: '#374151'
                    }}>
                      Automatically print receipts when orders are accepted
                    </label>
                  </div>
                  <p style={{ 
                    fontSize: '0.75rem', 
                    color: '#6b7280'
                  }}>
                    When enabled, receipts will automatically open in a new window for printing when you accept an order
                  </p>
                </div>

                {/* Print Test */}
                <div style={{
                  padding: '1.5rem',
                  backgroundColor: '#f9fafb',
                  borderRadius: '0.5rem',
                  border: '1px solid #e5e7eb'
                }}>
                  <h3 style={{ 
                    fontSize: '1.125rem', 
                    fontWeight: '600', 
                    color: '#374151',
                    marginBottom: '1rem'
                  }}>
                    Test Print
                  </h3>
                  
                  <p style={{ 
                    fontSize: '0.875rem', 
                    color: '#6b7280',
                    marginBottom: '1rem'
                  }}>
                    Print a test receipt to verify your printer is working correctly
                  </p>
                  
                  <button
                    onClick={printTestReceipt}
                    style={{
                      backgroundColor: '#dc2626',
                      color: 'white',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '0.5rem',
                      border: 'none',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Printer size={18} />
                    Print Test Receipt
                  </button>
                </div>

                {/* Printer Instructions */}
                <div style={{
                  padding: '1.5rem',
                  backgroundColor: '#fef3c7',
                  borderRadius: '0.5rem',
                  border: '1px solid #fbbf24'
                }}>
                  <h3 style={{ 
                    fontSize: '1.125rem', 
                    fontWeight: '600', 
                    color: '#92400e',
                    marginBottom: '1rem'
                  }}>
                    Printer Setup Instructions
                  </h3>
                  
                  <div style={{ color: '#92400e', fontSize: '0.875rem', lineHeight: '1.5' }}>
                    <p style={{ marginBottom: '0.5rem' }}>
                      <strong>1. Browser Setup:</strong> Make sure your browser allows pop-ups for this site
                    </p>
                    <p style={{ marginBottom: '0.5rem' }}>
                      <strong>2. Default Printer:</strong> Set your thermal receipt printer as the default printer
                    </p>
                    <p style={{ marginBottom: '0.5rem' }}>
                      <strong>3. Paper Size:</strong> Configure printer for 80mm (3.15") thermal paper width
                    </p>
                    <p style={{ marginBottom: '0.5rem' }}>
                      <strong>4. Print Settings:</strong> Disable headers/footers and set margins to minimum
                    </p>
                    <p>
                      <strong>5. Test Print:</strong> Use the button above to verify everything works correctly
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 50
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
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h3>
                <button
                  onClick={closeCategoryModal}
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
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.25rem'
                    }}
                    placeholder="Enter category name"
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
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={categoryForm.display_order}
                    onChange={(e) => setCategoryForm({ ...categoryForm, display_order: parseInt(e.target.value) || 0 })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.25rem'
                    }}
                    placeholder="Enter display order"
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: '500', 
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Category Image
                  </label>
                  
                  {selectedCategoryImagePreview || categoryForm.image_url ? (
                    <div style={{ marginBottom: '1rem' }}>
                      <img 
                        src={selectedCategoryImagePreview || categoryForm.image_url} 
                        alt="Category preview" 
                        style={{
                          width: '100%',
                          maxHeight: '200px',
                          objectFit: 'cover',
                          borderRadius: '0.25rem',
                          border: '1px solid #e5e7eb'
                        }}
                      />
                    </div>
                  ) : null}
                  
                  <div style={{
                    border: '2px dashed #d1d5db',
                    borderRadius: '0.5rem',
                    padding: '2rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s'
                  }}
                  onClick={() => document.getElementById('category-image-upload')?.click()}
                  >
                    <Upload size={24} style={{ margin: '0 auto 0.5rem', color: '#6b7280' }} />
                    <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                      Click to upload category image
                    </p>
                    <input
                      id="category-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleCategoryImageUpload}
                      style={{ display: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ 
                  display: 'flex', 
                  gap: '1rem', 
                  justifyContent: 'flex-end',
                  marginTop: '1rem'
                }}>
                  <button
                    onClick={closeCategoryModal}
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
                    onClick={saveCategory}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.25rem',
                      cursor: 'pointer'
                    }}
                  >
                    {editingCategory ? 'Save Changes' : 'Add Category'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
                    Photo Upload
                  </label>
                  <div style={{
                    border: '2px dashed #e5e7eb',
                    borderRadius: '0.5rem',
                    padding: '2rem',
                    textAlign: 'center',
                    backgroundColor: '#f9fafb'
                  }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                      id="image-upload"
                    />
                    <label 
                      htmlFor="image-upload"
                      style={{
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <Upload size={32} style={{ color: '#6b7280' }} />
                      <span style={{ color: '#374151', fontWeight: '500' }}>
                        Click to upload photo
                      </span>
                      <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                        PNG, JPG up to 5MB
                      </span>
                    </label>
                  </div>
                  {selectedImagePreview && (
                    <div style={{ marginTop: '1rem' }}>
                      <img 
                        src={selectedImagePreview}
                        alt="Preview"
                        style={{
                          maxWidth: '200px',
                          maxHeight: '200px',
                          borderRadius: '0.5rem',
                          border: '1px solid #e5e7eb'
                        }}
                      />
                    </div>
                  )}
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
                    value={menuItemForm.category_id}
                    onChange={(e) => setMenuItemForm({ ...menuItemForm, category_id: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.25rem'
                    }}
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
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
                    Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={menuItemForm.price}
                    onChange={(e) => setMenuItemForm({ ...menuItemForm, price: parseFloat(e.target.value) || 0 })}
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

                {editingMenuItem && (
                  <>
                    <div>
                      <label style={{ 
                        display: 'block', 
                        fontSize: '0.875rem', 
                        fontWeight: '500', 
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>
                        Sizes
                      </label>
                      <div style={{ 
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.5rem',
                        padding: '1rem',
                        marginBottom: '1rem'
                      }}>
                        {editingMenuItem.menu_item_sizes?.map(size => (
                          <div
                            key={size.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '0.5rem',
                              borderBottom: '1px solid #e5e7eb'
                            }}
                          >
                            <div>
                              <p style={{ fontWeight: '500' }}>{size.name}</p>
                              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                Price Modifier: ${size.price_modifier.toFixed(2)}
                                {size.is_default && ' (Default)'}
                              </p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                onClick={() => openSizeModal(editingMenuItem, size)}
                                style={{
                                  padding: '0.5rem',
                                  backgroundColor: '#f3f4f6',
                                  border: 'none',
                                  borderRadius: '0.375rem',
                                  cursor: 'pointer'
                                }}
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => deleteSize(editingMenuItem.id, size.id)}
                                style={{
                                  padding: '0.5rem',
                                  backgroundColor: '#fee2e2',
                                  border: 'none',
                                  borderRadius: '0.375rem',
                                  cursor: 'pointer'
                                }}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={() => openSizeModal(editingMenuItem)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem',
                            backgroundColor: '#f3f4f6',
                            border: 'none',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            marginTop: '1rem'
                          }}
                        >
                          <Plus size={16} />
                          Add Size
                        </button>
                      </div>
                    </div>

                    <div>
                      <label style={{ 
                        display: 'block', 
                        fontSize: '0.875rem', 
                        fontWeight: '500', 
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>
                        Modifier Groups
                      </label>
                      <div style={{ 
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.5rem',
                        padding: '1rem',
                        marginBottom: '1rem'
                      }}>
                        {editingMenuItem.menu_item_modifier_groups?.map(group => (
                          <div
                            key={group.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '0.5rem',
                              borderBottom: '1px solid #e5e7eb'
                            }}
                          >
                            <div>
                              <p style={{ fontWeight: '500' }}>{group.modifier_groups?.name}</p>
                              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                {group.menu_item_size_id 
                                  ? `For size: ${editingMenuItem.menu_item_sizes?.find(s => s.id === group.menu_item_size_id)?.name || 'Unknown'}`
                                  : '🌟 For all sizes'
                                }
                              </p>
                            </div>
                            <button
                              onClick={() => removeModifierGroup(editingMenuItem.id, group.modifier_group_id, group.menu_item_size_id)}
                              style={{
                                padding: '0.5rem',
                                backgroundColor: '#fee2e2',
                                border: 'none',
                                borderRadius: '0.375rem',
                                cursor: 'pointer'
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => openModifierGroupAssignModal(editingMenuItem)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem',
                            backgroundColor: '#f3f4f6',
                            border: 'none',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            marginTop: '1rem'
                          }}
                        >
                          <Plus size={16} />
                          Add Modifier Group
                        </button>
                      </div>
                    </div>
                  </>
                )}

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

      {/* Size Modal */}
      {showSizeModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 50
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
                  {editingSize ? 'Edit Size' : 'Add New Size'}
                </h3>
                <button
                  onClick={closeSizeModal}
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
                    Size Name
                  </label>
                  <input
                    type="text"
                    value={sizeForm.name}
                    onChange={(e) => setSizeForm({ ...sizeForm, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.25rem'
                    }}
                    placeholder="Enter size name"
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
                    Price Modifier
                  </label>
                  <input
                    type="number"
                    value={sizeForm.price_modifier}
                    onChange={(e) => setSizeForm({ ...sizeForm, price_modifier: parseFloat(e.target.value) || 0 })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.25rem'
                    }}
                    placeholder="Enter price modifier"
                    step="0.01"
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={sizeForm.is_default}
                      onChange={(e) => setSizeForm({ ...sizeForm, is_default: e.target.checked })}
                    />
                    Set as Default Size
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
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={sizeForm.sort_order}
                    onChange={(e) => setSizeForm({ ...sizeForm, sort_order: parseInt(e.target.value) || 0 })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.25rem'
                    }}
                    placeholder="Enter display order"
                  />
                </div>

                <div style={{ 
                  display: 'flex', 
                  gap: '1rem', 
                  justifyContent: 'flex-end',
                  marginTop: '1rem'
                }}>
                  <button
                    onClick={closeSizeModal}
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
                    onClick={saveSize}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.25rem',
                      cursor: 'pointer'
                    }}
                  >
                    {editingSize ? 'Save Changes' : 'Add Size'}
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

      {/* Modifier Item Modal */}
      {showModifierItemModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 50
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
                  {editingModifierItem ? 'Edit Modifier Item' : 'Add New Modifier Item'}
                </h3>
                <button
                  onClick={closeModifierItemModal}
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
                    Item Name
                  </label>
                  <input
                    type="text"
                    value={modifierItemForm.name}
                    onChange={(e) => setModifierItemForm({ ...modifierItemForm, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.25rem'
                    }}
                    placeholder="Enter item name"
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
                    Price
                  </label>
                  <input
                    type="number"
                    value={modifierItemForm.price}
                    onChange={(e) => setModifierItemForm({ ...modifierItemForm, price: parseFloat(e.target.value) || 0 })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.25rem'
                    }}
                    placeholder="Enter price"
                    step="0.01"
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={modifierItemForm.is_default}
                      onChange={(e) => setModifierItemForm({ ...modifierItemForm, is_default: e.target.checked })}
                    />
                    Set as Default Selection
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
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={modifierItemForm.sort_order}
                    onChange={(e) => setModifierItemForm({ ...modifierItemForm, sort_order: parseInt(e.target.value) || 0 })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.25rem'
                    }}
                    placeholder="Enter display order"
                  />
                </div>

                <div style={{ 
                  display: 'flex', 
                  gap: '1rem', 
                  justifyContent: 'flex-end',
                  marginTop: '1rem'
                }}>
                  <button
                    onClick={closeModifierItemModal}
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
                    onClick={saveModifierItem}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.25rem',
                      cursor: 'pointer'
                    }}
                  >
                    {editingModifierItem ? 'Save Changes' : 'Add Item'}
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



      {/* Size Modal */}
      {showSizeModal && (
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
                  {editingSize ? 'Edit Size' : 'Add Size'}
                </h3>
                <button
                  onClick={closeSizeModal}
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
                    value={sizeForm.name}
                    onChange={(e) => setSizeForm({ ...sizeForm, name: e.target.value })}
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
                    Price Modifier
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={sizeForm.price_modifier}
                    onChange={(e) => setSizeForm({ ...sizeForm, price_modifier: parseFloat(e.target.value) || 0 })}
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
                    id="is_default"
                    checked={sizeForm.is_default}
                    onChange={(e) => setSizeForm({ ...sizeForm, is_default: e.target.checked })}
                    style={{ marginRight: '0.25rem' }}
                  />
                  <label htmlFor="is_default" style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: '500', 
                    color: '#374151'
                  }}>
                    Default Size
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
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={sizeForm.sort_order}
                    onChange={(e) => setSizeForm({ ...sizeForm, sort_order: parseInt(e.target.value) || 0 })}
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
                    onClick={closeSizeModal}
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
                    onClick={saveSize}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.25rem',
                      cursor: 'pointer'
                    }}
                  >
                    {editingSize ? 'Update' : 'Create'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modifier Item Modal */}
      {showModifierItemModal && (
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
                  {editingModifierItem ? 'Edit Modifier Item' : 'Add Modifier Item'}
                </h3>
                <button
                  onClick={closeModifierItemModal}
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
                    value={modifierItemForm.name}
                    onChange={(e) => setModifierItemForm({ ...modifierItemForm, name: e.target.value })}
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
                    Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={modifierItemForm.price}
                    onChange={(e) => setModifierItemForm({ ...modifierItemForm, price: parseFloat(e.target.value) || 0 })}
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
                    id="is_default"
                    checked={modifierItemForm.is_default}
                    onChange={(e) => setModifierItemForm({ ...modifierItemForm, is_default: e.target.checked })}
                    style={{ marginRight: '0.25rem' }}
                  />
                  <label htmlFor="is_default" style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: '500', 
                    color: '#374151'
                  }}>
                    Default Item
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
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={modifierItemForm.sort_order}
                    onChange={(e) => setModifierItemForm({ ...modifierItemForm, sort_order: parseInt(e.target.value) || 0 })}
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
                    onClick={closeModifierItemModal}
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
                    onClick={saveModifierItem}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.25rem',
                      cursor: 'pointer'
                    }}
                  >
                    {editingModifierItem ? 'Update' : 'Create'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modifier Group Assign Modal */}
      {showModifierGroupAssignModal && (
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
                  Assign Modifier Group to Menu Item
                </h3>
                <button
                  onClick={closeModifierGroupAssignModal}
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
                    Select Menu Item
                  </label>
                  <select
                    value={selectedMenuItemForModifiers?.id}
                    onChange={(e) => setSelectedMenuItemForModifiers(menuItems.find(item => item.id === e.target.value) || null)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.25rem'
                    }}
                  >
                    <option value="">Select a menu item</option>
                    {menuItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
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
                    Select Size
                  </label>
                  <select
                    value={isAllSizesSelected ? 'all' : (selectedSizeForModifiers?.id || '')}
                    onChange={(e) => {
                      if (e.target.value === 'all') {
                        setIsAllSizesSelected(true)
                        setSelectedSizeForModifiers(null)
                      } else {
                        setIsAllSizesSelected(false)
                        const size = selectedMenuItemForModifiers?.menu_item_sizes?.find(s => s.id === e.target.value) || null
                        setSelectedSizeForModifiers(size)
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.25rem'
                    }}
                  >
                    <option value="all">🌟 All Sizes</option>
                    {selectedMenuItemForModifiers?.menu_item_sizes?.map(size => (
                      <option key={size.id} value={size.id}>
                        {size.name}
                      </option>
                    ))}
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
                    Select Modifier Group
                  </label>
                  <select
                    value={selectedModifierGroupForItems?.id}
                    onChange={(e) => setSelectedModifierGroupForItems(modifierGroups.find(group => group.id === e.target.value) || null)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.25rem'
                    }}
                  >
                    <option value="">Select a modifier group</option>
                    {modifierGroups.map(group => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ 
                  display: 'flex', 
                  gap: '1rem', 
                  justifyContent: 'flex-end',
                  marginTop: '1rem'
                }}>
                  <button
                    onClick={closeModifierGroupAssignModal}
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
                    onClick={() => assignModifierGroup(
                      selectedMenuItemForModifiers?.id || '', 
                      selectedModifierGroupForItems?.id || '', 
                      isAllSizesSelected ? 'all' : selectedSizeForModifiers?.id
                    )}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.25rem',
                      cursor: 'pointer'
                    }}
                  >
                    Assign Modifier Group
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