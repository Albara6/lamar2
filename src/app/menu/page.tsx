'use client'

import React, { useState, useEffect } from 'react'
import { ShoppingCart, Plus, Minus, ArrowLeft, X } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { MenuItem, MenuItemSize, ModifierGroup, ModifierItem, MenuItemModifierGroup, CartItem } from '@/types'
import { useRouter } from 'next/navigation'

interface MenuData {
  menuItems: MenuItem[]
  businessSettings: any
}

export default function MenuPage() {
  const router = useRouter()
  const cart = useCartStore()
  const [menuData, setMenuData] = useState<MenuData | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [selectedSize, setSelectedSize] = useState<MenuItemSize | null>(null)
  const [selectedModifiers, setSelectedModifiers] = useState<ModifierItem[]>([])
  const [quantity, setQuantity] = useState(1)
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCart, setShowCart] = useState(false)

  useEffect(() => {
    fetchMenu()
  }, [])

  const fetchMenu = async () => {
    try {
      const response = await fetch('/api/menu')
      const data = await response.json()
      setMenuData(data)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch menu:', error)
      setLoading(false)
    }
  }

  const categories = [
    { id: 'all', name: 'All Items', emoji: '🍽️' },
    { id: 'burgers', name: 'Crazy Burgers', emoji: '🍔' },
    { id: 'chicken', name: 'Crispy Chicken', emoji: '🍗' },
    { id: 'phillys', name: 'Philly Cheesesteaks', emoji: '🥪' }
  ]

  const filteredItems = menuData?.menuItems.filter(item => 
    selectedCategory === 'all' || item.category === selectedCategory
  ) || []

  const selectItem = (item: MenuItem) => {
    setSelectedItem(item)
    const defaultSize = item.menu_item_sizes?.find(size => size.is_default) || item.menu_item_sizes?.[0]
    setSelectedSize(defaultSize || null)
    
    // Set default modifiers
    const defaultModifiers: ModifierItem[] = []
    item.menu_item_modifier_groups?.forEach(group => {
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
  }

  const addToCart = () => {
    if (!selectedItem) return

    const basePrice = selectedItem.base_price + (selectedSize?.price_modifier || 0)
    const modifierPrice = selectedModifiers.reduce((sum, mod) => sum + mod.price, 0)
    const totalPrice = (basePrice + modifierPrice) * quantity

    const cartItem = {
      menuItem: selectedItem,
      selectedSize: selectedSize || undefined,
      selectedModifiers: [...selectedModifiers],
      quantity,
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
    
    // Check required modifier groups
    for (const group of selectedItem.menu_item_modifier_groups || []) {
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
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: 'white'
            }}>
              🍗 CRAZY CHICKEN MENU
            </div>
          </div>
          
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
      </nav>

      {/* Banner */}
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
                <span>{category.emoji}</span>
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1rem' }}>
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
                {item.image_url ? (
                  <img 
                    src={item.image_url} 
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
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center' 
                }}>
                  <span style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: 'bold', 
                    color: '#dc2626' 
                  }}>
                    ${item.base_price.toFixed(2)}
                  </span>
                  <button style={{
                    backgroundColor: '#dc2626',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}>
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
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
                <h2 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold', 
                  color: '#374151' 
                }}>
                  {selectedItem.name}
                </h2>
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

              {/* Size Selection */}
              {selectedItem.menu_item_sizes && selectedItem.menu_item_sizes.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ 
                    fontWeight: 'bold', 
                    fontSize: '1.125rem', 
                    marginBottom: '0.75rem' 
                  }}>
                    Choose Size
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selectedItem.menu_item_sizes.map(size => (
                      <button
                        key={size.id}
                        onClick={() => setSelectedSize(size)}
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
                          <span style={{ fontWeight: '500' }}>{size.name}</span>
                          <span style={{ 
                            color: '#dc2626', 
                            fontWeight: 'bold' 
                          }}>
                            {size.price_modifier > 0 ? `+$${size.price_modifier.toFixed(2)}` : 'Included'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Modifiers */}
              {selectedItem.menu_item_modifier_groups?.map(group => (
                <div key={group.modifier_groups.id} style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ 
                    fontWeight: 'bold', 
                    fontSize: '1.125rem', 
                    marginBottom: '0.75rem' 
                  }}>
                    {group.modifier_groups.name}
                    {group.modifier_groups.is_required && (
                      <span style={{ color: '#dc2626' }}> *</span>
                    )}
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
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center' 
                        }}>
                          <span style={{ fontWeight: '500' }}>{modifier.name}</span>
                          <span style={{ 
                            color: '#dc2626', 
                            fontWeight: 'bold' 
                          }}>
                            {modifier.price > 0 ? `+$${modifier.price.toFixed(2)}` : 'Free'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Special Instructions */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ 
                  fontWeight: 'bold', 
                  fontSize: '1.125rem', 
                  marginBottom: '0.75rem' 
                }}>
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

              {/* Quantity */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ 
                  fontWeight: 'bold', 
                  fontSize: '1.125rem', 
                  marginBottom: '0.75rem' 
                }}>
                  Quantity
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    style={{
                      padding: '0.5rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      background: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <Minus size={20} />
                  </button>
                  <span style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: 'bold', 
                    width: '2rem', 
                    textAlign: 'center' 
                  }}>
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    style={{
                      padding: '0.5rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      background: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              {/* Add to Cart Button */}
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
                Add to Cart - ${((selectedItem.base_price + (selectedSize?.price_modifier || 0) + 
                  selectedModifiers.reduce((sum, mod) => sum + mod.price, 0)) * quantity).toFixed(2)}
              </button>
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