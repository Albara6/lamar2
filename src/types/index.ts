// Database Types

// Restaurant Models
export interface Restaurant {
  id: string
  name: string
  slug: string
  website_url: string
  phone: string
  email: string
  address: string
  latitude?: number
  longitude?: number
  hours: Record<string, { open: string; close: string; closed: boolean }>
  is_accepting_orders: boolean
  logo_url?: string
  banner_enabled: boolean
  banner_text?: string
  banner_linked_item_id?: string
  supports_curbside: boolean
  supports_pickup_inside: boolean
  max_parking_spots: number
  created_at: string
  updated_at: string
}

export interface MenuItem {
  id: string
  restaurant_id: string
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
  restaurant_id: string
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
  is_verified: boolean
  preferred_restaurant_id?: string
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  restaurant_id: string
  customer_id: string
  total_amount: number
  payment_method: 'online' | 'cash'
  payment_status: 'pending' | 'paid' | 'failed'
  order_status: 'pending' | 'accepted' | 'rejected' | 'preparing' | 'ready' | 'picked_up' | 'completed'
  pickup_type: 'curbside' | 'pickup_inside'
  parking_spot_number?: string
  customer_arrival_status: 'not_arrived' | 'arrived' | 'parked'
  rejection_reason?: string
  phone_verified: boolean
  customer_name: string
  customer_email: string
  customer_phone: string
  estimated_ready_time?: string
  actual_ready_time?: string
  pickup_time?: string
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

export interface OrderStatusHistory {
  id: string
  order_id: string
  previous_status?: string
  new_status: string
  changed_by: 'customer' | 'admin' | 'system'
  notes?: string
  created_at: string
}

export interface BusinessSettings {
  id: string
  restaurant_id: string
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

// Push Notification Models
export interface PushNotification {
  id: string
  customer_id: string
  order_id: string
  device_token: string
  title: string
  body: string
  data?: Record<string, any>
  sent_at?: string
  delivery_status: 'pending' | 'sent' | 'delivered' | 'failed'
  created_at: string
}

export interface CustomerDeviceToken {
  id: string
  customer_id: string
  device_token: string
  device_type: 'ios' | 'android'
  is_active: boolean
  last_used_at: string
  created_at: string
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
  selectedRestaurant?: Restaurant
  pickupType?: 'curbside' | 'pickup_inside'
  addItem: (item: CartItem) => void
  removeItem: (index: number) => void
  updateQuantity: (index: number, quantity: number) => void
  clearCart: () => void
  setRestaurant: (restaurant: Restaurant) => void
  setPickupType: (type: 'curbside' | 'pickup_inside') => void
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
  restaurant: Restaurant
  pickupType: 'curbside' | 'pickup_inside'
}

// App-specific Types
export interface RestaurantSelectionResponse {
  restaurants: Restaurant[]
}

export interface MenuResponse {
  menuItems: MenuItem[]
  businessSettings: BusinessSettings
  categories: Category[]
  restaurant: Restaurant
}

export interface Category {
  id: string
  restaurant_id: string
  name: string
  image_url?: string
  display_order: number
  created_at: string
  updated_at: string
}

export interface OrderTrackingResponse {
  order: Order
  statusHistory: OrderStatusHistory[]
  estimatedReadyTime?: string
  actualReadyTime?: string
}

export interface CurbsideArrivalRequest {
  orderId: string
  parkingSpotNumber: string
}

export interface OrderStatusUpdate {
  orderId: string
  newStatus: Order['order_status']
  notes?: string
}

// Error and Success Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface VerificationResponse {
  success: boolean
  message: string
}

export interface VerifyCodeResponse {
  success: boolean
  message: string
  customer?: Customer
}

export interface PaymentResponse {
  success: boolean
  orderId?: string
  clientSecret?: string
  error?: string
}

// App State Types
export interface AppState {
  currentUser?: Customer
  selectedRestaurant?: Restaurant
  activeOrders: Order[]
  orderHistory: Order[]
}

export interface OrderTrackingState {
  orderId: string
  status: Order['order_status']
  pickupType: Order['pickup_type']
  parkingSpotNumber?: string
  estimatedReadyTime?: string
  actualReadyTime?: string
  customerArrivalStatus: Order['customer_arrival_status']
} 