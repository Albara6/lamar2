'use client'

import React, { useState, useEffect } from 'react'
import { ShoppingCart, Plus, Minus, ArrowLeft, X } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useAuth } from '@/lib/AuthProvider'
import { MenuItem, MenuItemSize, ModifierGroup, ModifierItem, MenuItemModifierGroup, CartItem, CartMenuItem, CartMenuItemSize, CartModifierItem } from '@/types'
import { useRouter } from 'next/navigation'

interface Category {
  id: string
  name: string
  display_order: number
}

interface MenuData {
  menuItems: MenuItem[]
  businessSettings: any
  categories: Category[]
}

export default function MenuPage() {
  const router = useRouter()
  const cart = useCartStore()
  const { user } = useAuth()
  const [menuData, setMenuData] = useState<MenuData | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  // default empty means no category selected yet
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [selectedSize, setSelectedSize] = useState<MenuItemSize | null>(null)
  const [selectedModifiers, setSelectedModifiers] = useState<ModifierItem[]>([])
  const [quantity, setQuantity] = useState(1)
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCart, setShowCart] = useState(false)
  const [isClosed, setIsClosed] = useState(false)

  // New state to control whether we are viewing category list or items list
  const [showCategoriesView, setShowCategoriesView] = useState(true)

  // Wizard step index inside item modal (0 = size or first modifier group)
  const [currentStep, setCurrentStep] = useState(0)

  // Get business name from settings or use default
  const displayName = menuData?.businessSettings?.name || 'CRAZY CHICKEN'

  useEffect(() => {
    fetchMenu()
    
    // Auto-refresh menu every 15 seconds to pick up admin changes faster
    const interval = setInterval(() => {
      fetchMenu()
    }, 15000)
    
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const evaluateClosed = () => {
      if (!menuData?.businessSettings) {
        setIsClosed(false)
        return
      }

      const settings = menuData.businessSettings

      // Immediate override: admin switched off accepting orders
      if (settings.is_accepting_orders === false) {
        setIsClosed(true)
        return
      }

      // Fallback if hours are not configured
      if (!settings.hours) {
        setIsClosed(false)
        return
      }

      const now = new Date()
      const weekday = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
      const today = settings.hours[weekday]

      // If day is explicitly marked closed, or data missing, mark closed
      if (!today || today.closed) {
        setIsClosed(true)
        return
      }

      const [openHour, openMinute] = today.open.split(':').map((v: string) => parseInt(v, 10))
      const [closeHour, closeMinute] = today.close.split(':').map((v: string) => parseInt(v, 10))

      const openTime = new Date(now)
      openTime.setHours(openHour, openMinute, 0, 0)

      const closeTime = new Date(now)
      closeTime.setHours(closeHour, closeMinute, 0, 0)

      // If the closing time is earlier than the opening time, it means the business
      // closes after midnight (e.g. 6 PM – 2 AM). In that case move closeTime to the
      // next day so the range comparison works correctly.
      if (closeTime <= openTime) {
        closeTime.setDate(closeTime.getDate() + 1)
      }

      // Determine if we are within the open window
      const isWithinHours = now >= openTime && now <= closeTime
      setIsClosed(!isWithinHours)
    }

    // Run on initial data load & whenever menuData changes
    evaluateClosed()

    // Re-evaluate every minute so the banner updates automatically
    const interval = setInterval(evaluateClosed, 60000)
    return () => clearInterval(interval)
  }, [menuData])

  const fetchMenu = async () => {
    try {
      // Add timestamp to prevent any caching
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
      
      // Ensure data has required structure
      const safeData = {
        menuItems: data.menuItems || [],
        businessSettings: data.businessSettings || { name: 'Crazy Chicken' },
        categories: data.categories || []
      }
      
      setMenuData(safeData)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch menu:', error)
      // Set fallback data so the app doesn't crash
      setMenuData({
        menuItems: [],
        businessSettings: { name: 'Crazy Chicken' },
        categories: []
      })
      setLoading(false)
    }
  }

  const categories = (menuData?.categories || []).map(cat => ({
    id: cat.id,
    name: cat.name,
    image_url: (cat as any).image_url || null,
    image_storage_url: (cat as any).image_storage_url || null
  }))

  const filteredItems = (menuData?.menuItems || []).filter(item => 
    !selectedCategory || item.category === selectedCategory
  ) || []

  const selectItem = (item: MenuItem) => {
    setSelectedItem(item)
    setCurrentStep(0)
    const defaultSize = item.menu_item_sizes?.find(size => size.is_default) || item.menu_item_sizes?.[0]
    setSelectedSize(defaultSize || null)
    
    // Set default modifiers (only for applicable groups based on selected size)
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
    if (isClosed) {
      alert('Sorry, we are currently closed and not accepting orders at this time.')
      return
    }
    if (!selectedItem) return

    const basePrice = selectedItem.base_price + (selectedSize?.price_modifier || 0)
    const modifierPrice = selectedModifiers.reduce((sum, mod) => sum + mod.price, 0)
    const totalPrice = basePrice + modifierPrice

    // Create a clean version of the menu item with only the necessary data
    const cleanMenuItem: CartMenuItem = {
      id: selectedItem.id,
      name: selectedItem.name,
      description: selectedItem.description,
      base_price: selectedItem.base_price,
      category: selectedItem.category
    }

    // Create a clean version of the size if selected
    const cleanSize: CartMenuItemSize | undefined = selectedSize ? {
      id: selectedSize.id,
      name: selectedSize.name,
      price_modifier: selectedSize.price_modifier
    } : undefined

    // Create clean versions of the modifiers
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

  const getCartTotal = () => {
    return cart.total
  }

  const toggleModifier = (modifier: ModifierItem, group: ModifierGroup) => {
    const isSelected = selectedModifiers.some(mod => mod.id === modifier.id)
    
    if (isSelected) {
      setSelectedModifiers(selectedModifiers.filter(mod => mod.id !== modifier.id))
    } else {
      // Check max selections for group
      const currentGroupModifiers = selectedModifiers.filter(mod => 
        group.modifier_items.some(item => item.id === mod.id)
      )
      
      if (group.max_selections && currentGroupModifiers.length >= group.max_selections) {
        // Remove oldest modifier from this group
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
    
    // Check required modifier groups (only applicable ones based on selected size)
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

    // Step 1: filter groups based on size selection
    const filtered = (item.menu_item_modifier_groups || []).filter(group => {
      const groupSizeId = group.menu_item_size_id || null

      // Always include groups not tied to any size (universal)
      if (!groupSizeId) return true

      // If a size is selected include only matching groups
      if (size) {
        return groupSizeId === size.id
      }

      // No size selected yet → exclude size-specific groups
      return false
    })

    // Step 2: deduplicate by modifier_group_id in case the same group is associated multiple times
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

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(180deg, #fef2f2 0%, #fefce8 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>
          Loading Menu...
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
            <button 
              onClick={() => router.push('/')}
              style={{
                padding: '0.5rem',
                color: 'white',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '0.5rem'
              }}
            >
              <ArrowLeft size={24} />
            </button>
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
                🍗 {displayName} MENU
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => {
                if (user) {
                  router.push('/account')
                } else {
                  // Clear guest flag to trigger auth modal
                  localStorage.removeItem('guest')
                  window.location.reload()
                }
              }}
              style={{
                position: 'relative',
                padding: '0.5rem',
                color: 'white',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              {user ? 'Account' : 'Sign In'}
            </button>
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
          </div>
        </div>
      </nav>

      {/* Banner */}
      {isClosed && (
        <div style={{
          backgroundColor: '#fbbf24',
          color: '#b91c1c',
          textAlign: 'center',
          padding: '1rem',
          fontWeight: 'bold',
          fontSize: '1.25rem'
        }}>
          Sorry, we are currently closed.
        </div>
      )}

      {menuData?.businessSettings?.banner_enabled && (
        <div style={{
          backgroundColor: '#fbbf24',
          color: '#dc2626',
          textAlign: 'center',
          padding: '0.75rem 1rem',
          fontWeight: 'bold'
        }}>
          {menuData.businessSettings.banner_text}
        </div>
      )}

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
              onClick={() => {
                setShowCategoriesView(true)
              }}
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
                onClick={() => {
                  setSelectedCategory(category.id)
                }}
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
                    src={category.image_storage_url || category.image_url} 
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
      </div>)}

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
                    <img src={cat.image_storage_url || cat.image_url} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
              onClick={() => {
                if (!isClosed) {
                  selectItem(item)
                }
              }}
              style={{
                backgroundColor: 'white',
                borderRadius: '0.5rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden',
                cursor: isClosed ? 'not-allowed' : 'pointer',
                opacity: isClosed ? 0.6 : 1,
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
                    src={item.image_storage_url || item.image_url} 
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
                <div style={{ 
                  textAlign: 'center'
                }}>
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
                    Customize
                  </button>
                </div>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>

      {/* Item Detail Modal */}
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

              {/* Wizard Steps */}
              {(() => {
                if (!selectedItem) return null

                const modifierGroups = getApplicableModifierGroups(selectedItem, selectedSize)
                const hasSizeStep = selectedItem.menu_item_sizes && selectedItem.menu_item_sizes.length > 0
                const sizeStepIndex = hasSizeStep ? 0 : -1
                const instructionsStepIndex = (hasSizeStep ? 1 : 0) + modifierGroups.length

                // Helper to render size step
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
                            // Reset modifiers when size changes
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

                // Helper to render modifier group step
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

                // Helper to render special instructions + summary step
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

                // Decide what to render based on currentStep
                if (currentStep === sizeStepIndex && hasSizeStep) {
                  return renderSizeStep()
                }

                // Modifier group steps
                const modifierStepStart = hasSizeStep ? 1 : 0
                const modifierIndex = currentStep - modifierStepStart
                if (modifierIndex >= 0 && modifierIndex < modifierGroups.length) {
                  return renderModifierStep(modifierGroups[modifierIndex])
                }

                // Instructions (final) step
                if (currentStep === instructionsStepIndex) {
                  return renderInstructionsStep()
                }

                return null
              })()}

              {/* Wizard Navigation Buttons */}
              {(() => {
                if (!selectedItem) return null
                const modifierGroups = getApplicableModifierGroups(selectedItem, selectedSize)
                const hasSizeStep = selectedItem.menu_item_sizes && selectedItem.menu_item_sizes.length > 0
                const totalSteps = (hasSizeStep ? 1 : 0) + modifierGroups.length + 1 // +1 for instructions

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
                      // Determine if Next should be disabled (required modifier not selected)
                      let nextDisabled = false

                      if (!selectedItem) nextDisabled = false
                      else {
                        const hasSizeStep = selectedItem.menu_item_sizes && selectedItem.menu_item_sizes.length > 0
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

              {/* Add to Cart Button (only show on final step) */}
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

      {/* Cart Modal */}
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
                  Your Cart
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
                  Your cart is empty
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
                      <span>${getCartTotal().toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => router.push('/checkout')}
                    style={{
                      width: '100%',
                      backgroundColor: '#dc2626',
                      color: 'white',
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      fontWeight: 'bold',
                      fontSize: '1.125rem',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Proceed to Checkout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Cart Summary */}
      {cart.items.length > 0 && !showCart && (
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
            Total: ${getCartTotal().toFixed(2)}
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
              router.push('/checkout')
            }}
          >
            Checkout
          </button>
        </div>
      )}
    </div>
  )
} 