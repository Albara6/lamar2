import { supabase } from './supabase'
import { format } from 'date-fns'

export async function calculateSafeBalance(): Promise<number> {
  // Get all drops
  const { data: drops } = await supabase
    .from('safe_drops')
    .select('amount')
    .eq('confirmed', true)

  // Get all withdrawals
  const { data: withdrawals } = await supabase
    .from('withdrawals')
    .select('amount')

  const totalDrops = drops?.reduce((sum: number, drop: any) => sum + drop.amount, 0) || 0
  const totalWithdrawals = withdrawals?.reduce((sum: number, withdrawal: any) => sum + withdrawal.amount, 0) || 0

  return totalDrops - totalWithdrawals
}

export async function calculateCashSalesForDate(date: string): Promise<number> {
  // Prefer using the server endpoint for correct RLS and 3am cutoff
  try {
    const res = await fetch('/api/sales/cash?date=' + encodeURIComponent(date))
    if (res.ok) {
      const json = await res.json()
      return json.cashSales || 0
    }
  } catch {}
  return 0
}

export async function calculateExpectedSafeBalance(): Promise<number> {
  // This should be calculated based on:
  // Previous safe balance + today's drops - today's withdrawals
  return calculateSafeBalance()
}

export async function calculateBankVariance(startDate: string, endDate: string): Promise<{
  expectedDeposits: number
  actualDeposits: number
  variance: number
}> {
  // Get card sales + check expenses (should be deposited)
  const { data: sales } = await supabase
    .from('daily_sales')
    .select('card_sales')
    .gte('date', startDate)
    .lte('date', endDate)

  const { data: checkExpenses } = await supabase
    .from('expenses')
    .select('amount')
    .gte('date', startDate)
    .lte('date', endDate)
    .eq('payment_type', 'check')

  const { data: deposits } = await supabase
    .from('deposits')
    .select('amount')
    .gte('date', startDate)
    .lte('date', endDate)

  const totalCardSales = sales?.reduce((sum: number, sale: any) => sum + sale.card_sales, 0) || 0
  const totalCheckExpenses = checkExpenses?.reduce((sum: number, expense: any) => sum + expense.amount, 0) || 0
  const totalDeposits = deposits?.reduce((sum: number, deposit: any) => sum + deposit.amount, 0) || 0

  const expectedDeposits = totalCardSales + totalCheckExpenses
  const variance = totalDeposits - expectedDeposits

  return {
    expectedDeposits,
    actualDeposits: totalDeposits,
    variance,
  }
}

export function generateReceiptNumber(): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `DROP-${timestamp}-${random}`
}

export function generateWithdrawalNumber(): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `WD-${timestamp}-${random}`
}

