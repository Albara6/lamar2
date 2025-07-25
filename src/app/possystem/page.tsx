'use client'

import React, { useState, useEffect } from 'react'
import { ShoppingCart, Plus, Minus, ArrowLeft, X, Eye, EyeOff, User, Bell, Send, Trash2 } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { MenuItem, MenuItemSize, ModifierGroup, ModifierItem, MenuItemModifierGroup, CartItem, CartMenuItem, CartMenuItemSize, CartModifierItem } from '@/types'

interface Category {
  id: string
  name: string
  display_order: number
  image_url?: string
  image_storage_url?: string
}

interface MenuData {
  menuItems: MenuItem[]
  businessSettings: any
  categories: Category[]
}

interface POSCheckoutData {
  customerName: string
  wantsNotification: boolean
  customerPhone?: string
  isPaid: boolean
}

export default function POSSystemPage() {
  // Authentication state
  const [authenticated, setAuthenticated] = useState(false)
  const [passcode, setPasscode] = useState('')
  const [showPasscode, setShowPasscode] = useState(false)

  // Menu state (copied from menu page)
  const cart = useCartStore()
  const [menuData, setMenuData] = useState<MenuData | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [selectedSize, setSelectedSize] = useState<MenuItemSize | null>(null)
  const [selectedModifiers, setSelectedModifiers] = useState<ModifierItem[]>([])
  const [quantity, setQuantity] = useState(1)
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [loading, setLoading] = useState(false)
  const [showCart, setShowCart] = useState(false)
  const [showCategoriesView, setShowCategoriesView] = useState(true)
  const [currentStep, setCurrentStep] = useState(0)

  // POS-specific state
  const [showPOSCheckout, setShowPOSCheckout] = useState(false)
  const [posCheckoutData, setPosCheckoutData] = useState<POSCheckoutData>({
    customerName: '',
    wantsNotification: false,
    customerPhone: '',
    isPaid: false
  })
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false)

  const displayName = menuData?.businessSettings?.name || 'CRAZY CHICKEN'

  useEffect(() => {
    if (authenticated) {
      fetchMenu()
      
      // Auto-refresh menu every 15 seconds to pick up admin changes faster
      const interval = setInterval(() => {
        fetchMenu()
      }, 15000)
      
      return () => clearInterval(interval)
    }
  }, [authenticated])

  const handleLogin = () => {
    if (passcode === '5548247') { // Same password as admin
      setAuthenticated(true)
      setPasscode('')
    } else {
      alert('Invalid passcode')
    }
  }

  const fetchMenu = async () => {
    try {
      setLoading(true)
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/menu?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      if (!response.ok) {
        throw new Error(`API responded with ${response.status}`)
      }
      
      const data = await response.json()
      
      const safeData = {
        menuItems: data.menuItems || [],
        businessSettings: data.businessSettings || { name: 'Crazy Chicken' },
        categories: data.categories || []
      }
      
      setMenuData(safeData)
    } catch (error) {
      console.error('Failed to fetch menu:', error)
      setMenuData({
        menuItems: [],
        businessSettings: { name: 'Crazy Chicken' },
        categories: []
      })
    } finally {
      setLoading(false)
    }
  }

  const categories = (menuData?.categories || []).map(cat => ({
    id: cat.id,
    name: cat.name,
    image_url: cat.image_url || null,
    image_storage_url: cat.image_storage_url || null
  }))

  const filteredItems = (menuData?.menuItems || []).filter(item => 
    !selectedCategory || item.category === selectedCategory
  ) || []

  const selectItem = (item: MenuItem) => {
    setSelectedItem(item)
    setCurrentStep(0)
    const defaultSize = item.menu_item_sizes?.find(size => size.is_default) || item.menu_item_sizes?.[0]
    setSelectedSize(defaultSize || null)
    
    const defaultModifiers: ModifierItem[] = []
    const applicableGroups = getApplicableModifierGroups(item, defaultSize || null)
    applicableGroups.forEach(group => {
      group.modifier_groups.modifier_items?.forEach(modifier => {
        if (modifier.is_default) {
          defaultModifiers.push(modifier)
        }
      })
    })
    setSelectedModifiers(defaultModifiers)
    setQuantity(1)
    setSpecialInstructions('')
  }

  const closeModal = () => {
    setSelectedItem(null)
    setSelectedSize(null)
    setSelectedModifiers([])
    setQuantity(1)
    setSpecialInstructions('')
    setCurrentStep(0)
  }

  const addToCart = () => {
    if (!selectedItem) return

    const basePrice = selectedItem.base_price + (selectedSize?.price_modifier || 0)
    const modifierPrice = selectedModifiers.reduce((sum, mod) => sum + mod.price, 0)
    const totalPrice = basePrice + modifierPrice

    const cleanMenuItem: CartMenuItem = {
      id: selectedItem.id,
      name: selectedItem.name,
      description: selectedItem.description,
      base_price: selectedItem.base_price,
      category: selectedItem.category
    }

    const cleanSize: CartMenuItemSize | undefined = selectedSize ? {
      id: selectedSize.id,
      name: selectedSize.name,
      price_modifier: selectedSize.price_modifier
    } : undefined

    const cleanModifiers: CartModifierItem[] = selectedModifiers.map(mod => ({
      id: mod.id,
      name: mod.name,
      price: mod.price
    }))

    const cartItem: CartItem = {
      menuItem: cleanMenuItem,
      selectedSize: cleanSize,
      selectedModifiers: cleanModifiers,
      quantity: 1,
      totalPrice,
      specialInstructions: specialInstructions.trim() || undefined
    }

    cart.addItem(cartItem)
    closeModal()
  }

  const removeFromCart = (index: number) => {
    cart.removeItem(index)
  }

  const toggleModifier = (modifier: ModifierItem, group: ModifierGroup) => {
    const isSelected = selectedModifiers.some(mod => mod.id === modifier.id)
    
    if (isSelected) {
      setSelectedModifiers(selectedModifiers.filter(mod => mod.id !== modifier.id))
    } else {
      const currentGroupModifiers = selectedModifiers.filter(mod => 
        group.modifier_items.some(item => item.id === mod.id)
      )
      
      if (group.max_selections && currentGroupModifiers.length >= group.max_selections) {
        const newModifiers = selectedModifiers.filter(mod => 
          !group.modifier_items.some(item => item.id === mod.id)
        )
        setSelectedModifiers([...newModifiers, modifier])
      } else {
        setSelectedModifiers([...selectedModifiers, modifier])
      }
    }
  }

  const canAddToCart = () => {
    if (!selectedItem) return false
    
    const applicableGroups = getApplicableModifierGroups(selectedItem, selectedSize)
    for (const group of applicableGroups) {
      if (group.modifier_groups.is_required) {
        const selectedFromGroup = selectedModifiers.filter(mod => 
          group.modifier_groups.modifier_items.some(item => item.id === mod.id)
        )
        if (selectedFromGroup.length < group.modifier_groups.min_selections) {
          return false
        }
      }
    }
    return true
  }

  const getApplicableModifierGroups = (
    item: MenuItem | null,
    size: MenuItemSize | null
  ) => {
    if (!item) return [] as MenuItemModifierGroup[]

    const filtered = (item.menu_item_modifier_groups || []).filter(group => {
      const groupSizeId = group.menu_item_size_id || null

      if (!groupSizeId) return true

      if (size) {
        return groupSizeId === size.id
      }

      return false
    })

    const seen = new Set<string>()
    const unique: MenuItemModifierGroup[] = []
    for (const g of filtered) {
      if (!seen.has(g.modifier_group_id)) {
        seen.add(g.modifier_group_id)
        unique.push(g)
      }
    }
    return unique
  }

  // POS-specific functions
  const openPOSCheckout = () => {
    setShowCart(false)
    setShowPOSCheckout(true)
  }

  const closePOSCheckout = () => {
    setShowPOSCheckout(false)
    setPosCheckoutData({
      customerName: '',
      wantsNotification: false,
      customerPhone: '',
      isPaid: false
    })
  }

  const submitPOSOrder = async () => {
    if (!posCheckoutData.customerName.trim()) {
      alert('Please enter customer name')
      return
    }

    if (posCheckoutData.wantsNotification && !posCheckoutData.customerPhone?.trim()) {
      alert('Please enter customer phone number for notifications')
      return
    }

    setIsSubmittingOrder(true)
    
    try {
      const orderData = {
        customer: {
          phone: posCheckoutData.customerPhone?.replace(/\D/g, '') || null,
          name: posCheckoutData.customerName.trim(),
          email: 'pos@crazychicken.local', // POS orders don't need real email
          isVerified: false
        },
        paymentMethod: 'cash', // POS orders are always cash
        items: cart.items,
        total: cart.total,
        notes: posCheckoutData.wantsNotification ? 'Customer wants notification when ready' : undefined,
        isPOSOrder: true, // Flag to indicate this is a POS order
        isPaid: posCheckoutData.isPaid, // Payment status for POS orders
        wantsNotification: posCheckoutData.wantsNotification // <-- ADD THIS LINE
      }

      console.log('POS Order Data being sent:', JSON.stringify(orderData, null, 2))
      
      const response = await fetch('/api/checkout/cash-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      console.log('API Response status:', response.status)
      console.log('API Response headers:', Object.fromEntries(response.headers))
      
      const data = await response.json()
      console.log('API Response data:', JSON.stringify(data, null, 2))
      
      if (!response.ok) {
        console.error('API returned error:', data)
        throw new Error(data.error || 'Order creation failed')
      }

      if (!data.success || !data.orderId) {
        throw new Error('Invalid response from server')
      }

      // Success!
      alert(`Order created successfully! Order #${data.orderId.slice(-8)}\n\nCustomer: ${posCheckoutData.customerName}\nTotal: $${cart.total.toFixed(2)}\n\nOrder sent to kitchen.`)
      
      // Clear everything
      cart.clearCart()
      closePOSCheckout()
      
    } catch (err: any) {
      console.error('POS order submission error:', err)
      alert(`Failed to submit order: ${err.message}`)
    } finally {
      setIsSubmittingOrder(false)
    }
  }

  // Authentication screen
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
              🍗 POS System
            </h1>
            <p style={{ color: '#6b7280' }}>Enter passcode to access POS system</p>
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
            Access POS System
          </button>
        </div>
      </div>
    )
  }

  if (loading && !menuData) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(180deg, #fef2f2 0%, #fefce8 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>
          Loading POS System...
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #fef2f2 0%, #fefce8 100%)' }}>
      {/* Header */}
      <nav style={{
        backgroundColor: '#dc2626',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '0 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '4rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <img 
                src="/business_logo.PNG" 
                alt={displayName}
                style={{
                  height: '2rem',
                  width: 'auto'
                }}
              />
              <div style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: 'white'
              }}>
                🍗 {displayName} POS
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              onClick={() => setShowCart(true)}
              style={{
                position: 'relative',
                padding: '0.5rem',
                color: 'white',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '0.5rem'
              }}
            >
              <ShoppingCart size={24} />
              {cart.items.length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  backgroundColor: '#fbbf24',
                  color: '#dc2626',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  borderRadius: '50%',
                  width: '1.25rem',
                  height: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {cart.items.length}
                </span>
              )}
            </button>
            
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
      </nav>

      {/* Categories */}
      {!showCategoriesView && (
        <div style={{
          backgroundColor: 'white',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          padding: '1rem',
          position: 'sticky',
          top: '4rem',
          zIndex: 40
        }}>
          <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
              <button
                onClick={() => setShowCategoriesView(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: '#f3f4f6',
                  color: '#374151'
                }}
              >
                <ArrowLeft size={16} />
                <span>Categories</span>
              </button>
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem',
                    fontWeight: '600',
                    whiteSpace: 'nowrap',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: selectedCategory === category.id ? '#dc2626' : '#f3f4f6',
                    color: selectedCategory === category.id ? 'white' : '#374151'
                  }}
                >
                  {(category.image_storage_url || category.image_url) && (
                    <img 
                      src={(category.image_storage_url || category.image_url) || ''} 
                      alt={category.name}
                      style={{
                        height: '1.5rem',
                        width: 'auto',
                        borderRadius: '0.25rem'
                      }}
                    />
                  )}
                  <span>{category.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Menu Items */}
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1rem' }}>
        {showCategoriesView ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem'
          }}>
            {categories.map(cat => (
              <div
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id)
                  setShowCategoriesView(false)
                }}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '0.5rem',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0px)'
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
              >
                <div style={{
                  height: '10rem',
                  backgroundColor: '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {(cat.image_storage_url || cat.image_url) ? (
                    <img src={(cat.image_storage_url || cat.image_url) || ''} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '3rem' }}>🍽️</span>
                  )}
                </div>
                <div style={{ padding: '1rem', textAlign: 'center' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#374151' }}>{cat.name}</h3>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem'
          }}>
            {filteredItems.map(item => (
              <div
                key={item.id}
                onClick={() => selectItem(item)}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '0.5rem',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0px)'
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
              >
                <div style={{
                  height: '12rem',
                  background: item.category === 'burgers' ? 'linear-gradient(135deg, #f87171 0%, #dc2626 100%)' :
                             item.category === 'chicken' ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' :
                             'linear-gradient(135deg, #34d399 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {(item.image_storage_url || item.image_url) ? (
                    <img 
                      src={(item.image_storage_url || item.image_url) || ''} 
                      alt={item.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ fontSize: '4rem' }}>
                      {item.category === 'burgers' && '🍔'}
                      {item.category === 'chicken' && '🍗'}
                      {item.category === 'phillys' && '🥪'}
                    </div>
                  )}
                </div>
                <div style={{ padding: '1.5rem' }}>
                  <h3 style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: 'bold', 
                    color: '#374151', 
                    marginBottom: '0.5rem' 
                  }}>
                    {item.name}
                  </h3>
                  <p style={{ 
                    color: '#6b7280', 
                    fontSize: '0.875rem', 
                    marginBottom: '1rem',
                    lineHeight: '1.4'
                  }}>
                    {item.description}
                  </p>
                  <div style={{ textAlign: 'center' }}>
                    <button style={{
                      backgroundColor: '#dc2626',
                      color: 'white',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      border: 'none',
                      fontWeight: '600',
                      cursor: 'pointer',
                      width: '100%'
                    }}>
                      Add to Order
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Item Detail Modal - exactly like menu page */}
      {selectedItem && (
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
                alignItems: 'flex-start', 
                marginBottom: '1rem' 
              }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: 'bold', 
                    color: '#374151',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}>
                    {selectedItem.name}
                    <span style={{
                      fontSize: '1.25rem',
                      color: '#dc2626',
                      fontWeight: 'bold'
                    }}>
                      ${(
                        selectedItem.base_price +
                        (selectedSize?.price_modifier || 0) +
                        selectedModifiers.reduce((sum, mod) => sum + mod.price, 0)
                      ).toFixed(2)}
                    </span>
                  </h2>
                </div>
                <button
                  onClick={closeModal}
                  style={{
                    color: '#6b7280',
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    padding: '0.25rem'
                  }}
                >
                  <X size={20} />
                </button>
              </div>
              
              <p style={{ 
                color: '#6b7280', 
                marginBottom: '1.5rem',
                lineHeight: '1.5'
              }}>
                {selectedItem.description}
              </p>

              {/* Size and Modifier selection logic - copied from menu page */}
              {(() => {
                if (!selectedItem) return null

                const modifierGroups = getApplicableModifierGroups(selectedItem, selectedSize)
                const hasSizeStep = selectedItem.menu_item_sizes && selectedItem.menu_item_sizes.length > 0
                const sizeStepIndex = hasSizeStep ? 0 : -1
                const instructionsStepIndex = (hasSizeStep ? 1 : 0) + modifierGroups.length

                const renderSizeStep = () => (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ 
                      fontWeight: 'bold', 
                      fontSize: '1.125rem', 
                      marginBottom: '0.75rem',
                      color: '#374151'
                    }}>
                      Choose Size
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {(selectedItem.menu_item_sizes || []).map(size => (
                        <button
                          key={size.id}
                          onClick={() => {
                            setSelectedSize(size)
                            const applicableGroups = getApplicableModifierGroups(selectedItem, size)
                            const newDefaultModifiers: ModifierItem[] = []
                            applicableGroups.forEach(g => {
                              g.modifier_groups.modifier_items?.forEach(mod => {
                                if (mod.is_default) newDefaultModifiers.push(mod)
                              })
                            })
                            setSelectedModifiers(newDefaultModifiers)
                          }}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            border: `2px solid ${selectedSize?.id === size.id ? '#dc2626' : '#e5e7eb'}`,
                            backgroundColor: selectedSize?.id === size.id ? '#fef2f2' : 'white',
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center' 
                          }}>
                            <span style={{ fontWeight: '500', color: '#374151' }}>{size.name}</span>
                            <span style={{ 
                              color: '#dc2626', 
                              fontWeight: 'bold' 
                            }}>
                              {size.price_modifier > 0 ? `$${size.price_modifier.toFixed(2)}` : 'Included'}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )

                const renderModifierStep = (group: typeof modifierGroups[0]) => (
                  <div key={group.modifier_groups.id} style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ 
                      fontWeight: 'bold', 
                      fontSize: '1.125rem', 
                      marginBottom: '0.75rem',
                      color: '#374151'
                    }}>
                      {group.modifier_groups.name}
                      {group.modifier_groups.is_required && <span style={{ color: '#dc2626' }}> *</span>}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {group.modifier_groups.modifier_items?.map(modifier => (
                        <button
                          key={modifier.id}
                          onClick={() => toggleModifier(modifier, group.modifier_groups)}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            border: `2px solid ${selectedModifiers.some(mod => mod.id === modifier.id) ? '#dc2626' : '#e5e7eb'}`,
                            backgroundColor: selectedModifiers.some(mod => mod.id === modifier.id) ? '#fef2f2' : 'white',
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: '500', color: '#374151' }}>{modifier.name}</span>
                            <span style={{ color: '#dc2626', fontWeight: 'bold' }}>
                              {modifier.price > 0 ? `$${modifier.price.toFixed(2)}` : 'Free'}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )

                const renderInstructionsStep = () => (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontWeight: 'bold', fontSize: '1.125rem', marginBottom: '0.75rem', color: '#374151' }}>
                      Special Instructions
                    </h3>
                    <textarea
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      placeholder="Any special requests?"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        resize: 'vertical',
                        minHeight: '4rem'
                      }}
                    />
                  </div>
                )

                // Render current step
                if (currentStep === sizeStepIndex && hasSizeStep) {
                  return renderSizeStep()
                }

                const modifierStepStart = hasSizeStep ? 1 : 0
                const modifierIndex = currentStep - modifierStepStart
                if (modifierIndex >= 0 && modifierIndex < modifierGroups.length) {
                  return renderModifierStep(modifierGroups[modifierIndex])
                }

                if (currentStep === instructionsStepIndex) {
                  return renderInstructionsStep()
                }

                return null
              })()}

              {/* Navigation buttons */}
              {(() => {
                if (!selectedItem) return null
                const modifierGroups = getApplicableModifierGroups(selectedItem, selectedSize)
                const hasSizeStep = selectedItem.menu_item_sizes && selectedItem.menu_item_sizes.length > 0
                const totalSteps = (hasSizeStep ? 1 : 0) + modifierGroups.length + 1
                const atLastStep = currentStep >= totalSteps - 1

                return (
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                    {currentStep > 0 && (
                      <button
                        onClick={() => setCurrentStep(currentStep - 1)}
                        style={{ flex: 1, backgroundColor: '#fbbf24', color: '#374151', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
                      >
                        Back
                      </button>
                    )}
                    {!atLastStep && (() => {
                      let nextDisabled = false

                      if (selectedItem) {
                        const modifierGroups = getApplicableModifierGroups(selectedItem, selectedSize)
                        const modifierStepStart = hasSizeStep ? 1 : 0
                        const modifierIndex = currentStep - modifierStepStart

                        if (modifierIndex >= 0 && modifierIndex < modifierGroups.length) {
                          const group = modifierGroups[modifierIndex].modifier_groups
                          if (group.is_required && group.min_selections > 0) {
                            const selectedCount = selectedModifiers.filter(mod =>
                              group.modifier_items?.some(item => item.id === mod.id)
                            ).length
                            if (selectedCount < group.min_selections) {
                              nextDisabled = true
                            }
                          }
                        }
                      }

                      return (
                        <button
                          onClick={() => !nextDisabled && setCurrentStep(currentStep + 1)}
                          disabled={nextDisabled}
                          style={{
                            flex: 1,
                            backgroundColor: nextDisabled ? '#9ca3af' : '#dc2626',
                            color: 'white',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            fontWeight: 'bold',
                            border: 'none',
                            cursor: nextDisabled ? 'not-allowed' : 'pointer'
                          }}
                        >
                          Next
                        </button>
                      )
                    })()}
                  </div>
                )
              })()}

              {/* Add to Cart Button */}
              {(() => {
                if (!selectedItem) return null
                const modifierGroups = getApplicableModifierGroups(selectedItem, selectedSize)
                const hasSizeStep = selectedItem.menu_item_sizes && selectedItem.menu_item_sizes.length > 0
                const totalSteps = (hasSizeStep ? 1 : 0) + modifierGroups.length + 1
                const atLastStep = currentStep >= totalSteps - 1

                if (!atLastStep) return null

                return (
                  <button
                    onClick={addToCart}
                    disabled={!canAddToCart()}
                    style={{
                      width: '100%',
                      backgroundColor: canAddToCart() ? '#dc2626' : '#9ca3af',
                      color: 'white',
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      fontWeight: 'bold',
                      fontSize: '1.125rem',
                      border: 'none',
                      cursor: canAddToCart() ? 'pointer' : 'not-allowed'
                    }}
                  >
                    Add to Cart - ${(selectedItem.base_price + (selectedSize?.price_modifier || 0) + selectedModifiers.reduce((sum, mod) => sum + mod.price, 0)).toFixed(2)}
                  </button>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* POS Cart Modal */}
      {showCart && (
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
                <h2 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold', 
                  color: '#374151' 
                }}>
                  Current Order
                </h2>
                <button
                  onClick={() => setShowCart(false)}
                  style={{
                    color: '#6b7280',
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    padding: '0.25rem'
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {cart.items.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  color: '#6b7280', 
                  padding: '2rem' 
                }}>
                  No items in cart
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: '1.5rem' }}>
                    {cart.items.map((item, index) => (
                      <div key={index} style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.5rem',
                        padding: '1rem',
                        marginBottom: '0.75rem'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'flex-start' 
                        }}>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ 
                              fontWeight: 'bold', 
                              marginBottom: '0.25rem' 
                            }}>
                              {item.menuItem.name}
                            </h4>
                            {item.selectedSize && (
                              <p style={{ 
                                fontSize: '0.875rem', 
                                color: '#6b7280' 
                              }}>
                                Size: {item.selectedSize.name}
                              </p>
                            )}
                            {item.selectedModifiers.length > 0 && (
                              <p style={{ 
                                fontSize: '0.875rem', 
                                color: '#6b7280' 
                              }}>
                                Add-ons: {item.selectedModifiers.map(mod => mod.name).join(', ')}
                              </p>
                            )}
                            {item.specialInstructions && (
                              <p style={{ 
                                fontSize: '0.875rem', 
                                color: '#6b7280',
                                fontStyle: 'italic'
                              }}>
                                Note: {item.specialInstructions}
                              </p>
                            )}
                            <p style={{ 
                              fontSize: '0.875rem', 
                              fontWeight: 'bold' 
                            }}>
                              Qty: {item.quantity} × ${(item.totalPrice / item.quantity).toFixed(2)} = ${item.totalPrice.toFixed(2)}
                            </p>
                          </div>
                          <button
                            onClick={() => removeFromCart(index)}
                            style={{
                              color: '#dc2626',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '0.25rem'
                            }}
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ 
                    borderTop: '2px solid #e5e7eb',
                    paddingTop: '1rem',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      fontSize: '1.25rem',
                      fontWeight: 'bold'
                    }}>
                      <span>Total:</span>
                      <span>${cart.total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      onClick={() => cart.clearCart()}
                      style={{
                        flex: 1,
                        backgroundColor: '#6b7280',
                        color: 'white',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        fontWeight: 'bold',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <Trash2 size={18} />
                      Clear
                    </button>
                    <button
                      onClick={openPOSCheckout}
                      style={{
                        flex: 2,
                        backgroundColor: '#dc2626',
                        color: 'white',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        fontWeight: 'bold',
                        fontSize: '1.125rem',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <Send size={18} />
                      Send to Kitchen
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* POS Checkout Modal */}
      {showPOSCheckout && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 70
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            maxWidth: '28rem',
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
                <h2 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold', 
                  color: '#374151' 
                }}>
                  Send to Kitchen
                </h2>
                <button
                  onClick={closePOSCheckout}
                  style={{
                    color: '#6b7280',
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    padding: '0.25rem'
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Order Summary */}
              <div style={{
                backgroundColor: '#f9fafb',
                padding: '1rem',
                borderRadius: '0.5rem',
                marginBottom: '1.5rem',
                border: '1px solid #e5e7eb'
              }}>
                <h3 style={{ fontWeight: 'bold', marginBottom: '0.75rem', color: '#374151' }}>
                  Order Summary ({cart.items.length} items)
                </h3>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                  {cart.items.map((item, index) => (
                    <div key={index} style={{ marginBottom: '0.25rem' }}>
                      {item.quantity}x {item.menuItem.name} - ${item.totalPrice.toFixed(2)}
                    </div>
                  ))}
                </div>
                <div style={{ 
                  borderTop: '1px solid #e5e7eb', 
                  paddingTop: '0.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 'bold'
                }}>
                  <span>Total:</span>
                  <span>${cart.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Customer Name */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'flex', 
                  fontWeight: 'bold', 
                  marginBottom: '0.5rem', 
                  color: '#374151',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <User size={18} />
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={posCheckoutData.customerName}
                  onChange={(e) => setPosCheckoutData(prev => ({ ...prev, customerName: e.target.value }))}
                  placeholder="Enter customer name"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '1rem'
                  }}
                />
              </div>

              {/* Notification Preference */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  cursor: 'pointer',
                  padding: '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  backgroundColor: posCheckoutData.wantsNotification ? '#fef2f2' : 'white',
                  borderColor: posCheckoutData.wantsNotification ? '#dc2626' : '#e5e7eb'
                }}>
                  <input
                    type="checkbox"
                    checked={posCheckoutData.wantsNotification}
                    onChange={(e) => setPosCheckoutData(prev => ({ 
                      ...prev, 
                      wantsNotification: e.target.checked,
                      customerPhone: e.target.checked ? prev.customerPhone : ''
                    }))}
                    style={{ width: '1rem', height: '1rem' }}
                  />
                  <Bell size={18} color={posCheckoutData.wantsNotification ? '#dc2626' : '#6b7280'} />
                  <span style={{ fontWeight: '500', color: '#374151' }}>
                    Customer wants notification when ready
                  </span>
                </label>
              </div>

              {/* Phone Number (if notification requested) */}
              {posCheckoutData.wantsNotification && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ 
                    display: 'block', 
                    fontWeight: 'bold', 
                    marginBottom: '0.5rem', 
                    color: '#374151'
                  }}>
                    Customer Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={posCheckoutData.customerPhone || ''}
                    onChange={(e) => setPosCheckoutData(prev => ({ ...prev, customerPhone: e.target.value }))}
                    placeholder="(555) 123-4567"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              )}

              {/* Payment Status */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block', 
                  fontWeight: 'bold', 
                  marginBottom: '0.75rem', 
                  color: '#374151'
                }}>
                  Payment Status *
                </label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setPosCheckoutData(prev => ({ ...prev, isPaid: true }))}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      border: `2px solid ${posCheckoutData.isPaid ? '#10b981' : '#e5e7eb'}`,
                      borderRadius: '0.5rem',
                      backgroundColor: posCheckoutData.isPaid ? '#f0fdf4' : 'white',
                      color: posCheckoutData.isPaid ? '#059669' : '#374151',
                      fontWeight: posCheckoutData.isPaid ? 'bold' : 'normal',
                      cursor: 'pointer',
                      fontSize: '1rem'
                    }}
                  >
                    💳 PAID
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosCheckoutData(prev => ({ ...prev, isPaid: false }))}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      border: `2px solid ${!posCheckoutData.isPaid ? '#f59e0b' : '#e5e7eb'}`,
                      borderRadius: '0.5rem',
                      backgroundColor: !posCheckoutData.isPaid ? '#fffbeb' : 'white',
                      color: !posCheckoutData.isPaid ? '#d97706' : '#374151',
                      fontWeight: !posCheckoutData.isPaid ? 'bold' : 'normal',
                      cursor: 'pointer',
                      fontSize: '1rem'
                    }}
                  >
                    💵 NOT PAID
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={submitPOSOrder}
                disabled={isSubmittingOrder || !posCheckoutData.customerName.trim()}
                style={{
                  width: '100%',
                  backgroundColor: (isSubmittingOrder || !posCheckoutData.customerName.trim()) ? '#9ca3af' : '#dc2626',
                  color: 'white',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  fontWeight: 'bold',
                  fontSize: '1.125rem',
                  border: 'none',
                  cursor: (isSubmittingOrder || !posCheckoutData.customerName.trim()) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <Send size={20} />
                {isSubmittingOrder ? 'Sending to Kitchen...' : 'Send to Kitchen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Cart Summary */}
      {cart.items.length > 0 && !showCart && !showPOSCheckout && (
        <div style={{
          position: 'fixed',
          bottom: '1rem',
          right: '1rem',
          backgroundColor: '#dc2626',
          color: 'white',
          padding: '1rem',
          borderRadius: '0.5rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          cursor: 'pointer'
        }}
        onClick={() => setShowCart(true)}
        >
          <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
            {cart.items.length} item{cart.items.length !== 1 ? 's' : ''} in cart
          </div>
          <div style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>
            Total: ${cart.total.toFixed(2)}
          </div>
          <button 
            style={{
              width: '100%',
              backgroundColor: '#fbbf24',
              color: '#dc2626',
              padding: '0.5rem',
              borderRadius: '0.25rem',
              border: 'none',
              fontWeight: 'bold',
              marginTop: '0.5rem',
              cursor: 'pointer'
            }}
            onClick={(e) => {
              e.stopPropagation()
              setShowCart(true)
            }}
          >
            View Cart
          </button>
        </div>
      )}
    </div>
  )
} 