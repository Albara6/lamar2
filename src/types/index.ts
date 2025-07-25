// Database Types
export interface MenuItem {
  id: string
  name: string
  description?: string
  category: string
  image_url?: string
  image_storage_url?: string // New field for Supabase Storage URLs
  base_price: number
  is_available: boolean
  sort_order: number
  created_at: string
  updated_at: string
  menu_item_sizes?: MenuItemSize[]
  menu_item_modifier_groups?: MenuItemModifierGroup[]
}

export interface MenuItemSize {
  id: string
  menu_item_id: string
  name: string
  price_modifier: number
  is_default: boolean
  sort_order: number
  created_at: string
}

export interface ModifierGroup {
  id: string
  name: string
  is_required: boolean
  max_selections?: number
  min_selections: number
  sort_order: number
  created_at: string
  modifier_items: ModifierItem[]
}

export interface ModifierItem {
  id: string
  group_id: string
  name: string
  price: number
  is_default: boolean
  sort_order: number
  created_at: string
}

export interface MenuItemModifierGroup {
  id: string
  menu_item_id: string
  menu_item_size_id?: string
  modifier_group_id: string
  created_at: string
  modifier_groups: ModifierGroup
}

export interface Customer {
  id: string
  phone_number: string
  name?: string
  email?: string
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  customer_id: string
  total_amount: number
  payment_method: 'online' | 'cash'
  payment_status: 'pending' | 'paid' | 'failed'
  order_status: 'initiated' | 'pending' | 'accepted' | 'rejected' | 'ready' | 'completed'
  rejection_reason?: string
  phone_verified: boolean
  customer_name: string
  customer_email: string
  customer_phone: string
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string
  menu_item_size_id?: string
  quantity: number
  unit_price: number
  total_price: number
  special_instructions?: string
}

export interface OrderItemModifier {
  id: string
  order_item_id: string
  modifier_item_id: string
  price: number
}

export interface BusinessSettings {
  id: string
  name: string
  phone: string
  email: string
  address: string
  hours: Record<string, { open: string; close: string; closed: boolean }>
  is_accepting_orders: boolean
  banner_enabled: boolean
  banner_text?: string
  banner_linked_item_id?: string
  created_at: string
  updated_at: string
}

// Frontend Types
export interface CartMenuItem {
  id: string
  name: string
  description?: string
  base_price: number
  category: string
}

export interface CartMenuItemSize {
  id: string
  name: string
  price_modifier: number
}

export interface CartModifierItem {
  id: string
  name: string
  price: number
}

export interface CartItem {
  menuItem: CartMenuItem
  selectedSize?: CartMenuItemSize
  selectedModifiers: CartModifierItem[]
  quantity: number
  specialInstructions?: string
  totalPrice: number
}

export interface CartStore {
  items: CartItem[]
  total: number
  addItem: (item: CartItem) => void
  removeItem: (index: number) => void
  updateQuantity: (index: number, quantity: number) => void
  clearCart: () => void
}

export interface CustomerInfo {
  phone: string
  name: string
  email: string
  isVerified: boolean
}

export interface CheckoutData {
  customer: CustomerInfo
  paymentMethod: 'online' | 'cash'
  items: CartItem[]
  total: number
} 