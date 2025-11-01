'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { User } from '@/lib/auth'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

interface Vendor {
  id: string
  name: string
}

export default function RecordExpense() {
  const [user, setUser] = useState<User | null>(null)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [selectedVendor, setSelectedVendor] = useState('')
  const [newVendorName, setNewVendorName] = useState('')
  const [showNewVendor, setShowNewVendor] = useState(false)
  const [amount, setAmount] = useState('')
  const [paymentType, setPaymentType] = useState<'cash' | 'check'>('cash')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [notes, setNotes] = useState('')
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const userStr = sessionStorage.getItem('safePanel_user')
    if (!userStr) {
      router.push('/safe-panel')
      return
    }
    setUser(JSON.parse(userStr))
    loadVendors()
  }, [router])

  const loadVendors = async () => {
    const { data, error } = await supabase
      .from('vendors')
      .select('id, name')
      .eq('type', 'vendor')
      .eq('active', true)
      .order('name')

    if (!error && data) {
      setVendors(data)
    }
  }

  const handleNumberClick = (num: string) => {
    setAmount(amount + num)
  }

  const handleDecimal = () => {
    if (!amount.includes('.') && amount.length > 0) {
      setAmount(amount + '.')
    }
  }

  const handleClear = () => {
    setAmount('')
  }

  const handleBackspace = () => {
    setAmount(amount.slice(0, -1))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptFile(e.target.files[0])
    }
  }

  const handleAddVendor = async () => {
    if (!newVendorName.trim()) return

    const { data, error } = await supabase
      .from('vendors')
      .insert([{ name: newVendorName, type: 'vendor' }] as any)
      .select()
      .single()

    if (!error && data) {
      setVendors([...vendors, data])
      setSelectedVendor((data as any).id)
      setNewVendorName('')
      setShowNewVendor(false)
    }
  }

  const handleSubmit = async () => {
    if (!user || !amount || parseFloat(amount) <= 0 || !selectedVendor) {
      alert('Please fill in all required fields')
      return
    }

    setLoading(true)

    try {
      let receiptUrl = null

      // Upload receipt if provided
      if (receiptFile) {
        const fileExt = receiptFile.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(fileName, receiptFile)

        if (!uploadError && uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from('receipts')
            .getPublicUrl(fileName)
          receiptUrl = publicUrl
        }
      }

      const { error } = await supabase
        .from('expenses')
        .insert([{
          vendor_id: selectedVendor,
          user_id: user.id,
          amount: parseFloat(amount),
          payment_type: paymentType,
          date: date,
          notes: notes || null,
          receipt_url: receiptUrl,
        }] as any)

      if (error) {
        console.error('Error recording expense:', error)
        alert('Failed to record expense. Please try again.')
        return
      }

      setSuccess(true)
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleNewExpense = () => {
    setAmount('')
    setSelectedVendor('')
    setNotes('')
    setReceiptFile(null)
    setPaymentType('cash')
    setDate(format(new Date(), 'yyyy-MM-dd'))
    setSuccess(false)
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center kiosk-mode">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Expense Recorded!</h2>
            <p className="text-gray-600 mb-6">The expense has been successfully saved.</p>
            
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="text-sm text-gray-600 mb-1">Amount</div>
              <div className="text-4xl font-bold text-red-600">${parseFloat(amount).toFixed(2)}</div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleNewExpense}
                className="flex-1 btn-primary"
              >
                New Expense
              </button>
              <button
                onClick={() => router.push('/safe-panel/home')}
                className="flex-1 btn-secondary"
              >
                Home
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 kiosk-mode">
      <div className="bg-red-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Record Expense</h1>
            <p className="text-red-100 mt-1">Recording as: {user.name}</p>
          </div>
          <button
            onClick={() => router.push('/safe-panel/home')}
            className="bg-white text-red-600 px-6 py-3 rounded-lg font-semibold hover:bg-red-50"
          >
            Cancel
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column - Form */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Expense Details</h3>
            
            {/* Vendor Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Vendor *</label>
              {!showNewVendor ? (
                <>
                  <select
                    value={selectedVendor}
                    onChange={(e) => setSelectedVendor(e.target.value)}
                    className="input-field mb-2"
                    disabled={loading}
                  >
                    <option value="">Select a vendor...</option>
                    {vendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setShowNewVendor(true)}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    + Add New Vendor
                  </button>
                </>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newVendorName}
                    onChange={(e) => setNewVendorName(e.target.value)}
                    placeholder="Vendor name"
                    className="input-field"
                  />
                  <button onClick={handleAddVendor} className="btn-primary whitespace-nowrap">
                    Add
                  </button>
                  <button onClick={() => setShowNewVendor(false)} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Date */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input-field"
                disabled={loading}
              />
            </div>

            {/* Payment Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Type *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPaymentType('cash')}
                  className={`py-3 px-4 rounded-lg font-semibold ${
                    paymentType === 'cash'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                  disabled={loading}
                >
                  Cash
                </button>
                <button
                  onClick={() => setPaymentType('check')}
                  className={`py-3 px-4 rounded-lg font-semibold ${
                    paymentType === 'check'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                  disabled={loading}
                >
                  Check
                </button>
              </div>
            </div>

            {/* Notes */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-field"
                rows={3}
                placeholder="Optional notes..."
                disabled={loading}
              />
            </div>

            {/* Receipt Upload */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Receipt Photo (Optional)</label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="input-field"
                disabled={loading}
              />
              {receiptFile && (
                <p className="text-sm text-green-600 mt-1">✓ {receiptFile.name}</p>
              )}
            </div>
          </div>

          {/* Right Column - Amount */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Amount *</h3>
            
            <div className="text-5xl font-bold text-red-600 text-center py-6 bg-gray-50 rounded-xl mb-4">
              ${amount || '0.00'}
            </div>

            {/* Number Pad */}
            <div className="grid grid-cols-3 gap-3">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  onClick={() => handleNumberClick(num)}
                  className="touch-button bg-gray-100 hover:bg-gray-200 text-gray-800 h-16 text-2xl"
                  disabled={loading}
                >
                  {num}
                </button>
              ))}
              <button
                onClick={handleDecimal}
                className="touch-button bg-gray-100 hover:bg-gray-200 text-gray-800 h-16 text-2xl"
                disabled={loading}
              >
                .
              </button>
              <button
                onClick={() => handleNumberClick('0')}
                className="touch-button bg-gray-100 hover:bg-gray-200 text-gray-800 h-16 text-2xl"
                disabled={loading}
              >
                0
              </button>
              <button
                onClick={handleBackspace}
                className="touch-button bg-red-100 hover:bg-red-200 text-red-700 h-16 text-xl"
                disabled={loading}
              >
                ⌫
              </button>
            </div>

            <button
              onClick={handleClear}
              className="w-full btn-secondary mt-3"
              disabled={loading}
            >
              Clear
            </button>

            <button
              onClick={handleSubmit}
              className="w-full btn-primary mt-4 text-xl py-5"
              disabled={!amount || parseFloat(amount) <= 0 || !selectedVendor || loading}
            >
              {loading ? 'Recording...' : 'Record Expense'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

