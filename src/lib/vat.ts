// VAT utility functions for German tax system
export const VAT_RATE = 0.19 // 19% VAT rate in Germany

export interface VATCalculation {
  grossPrice: number
  netPrice: number
  vatAmount: number
  vatRate: number
}

/**
 * Calculate VAT breakdown from gross price (price including VAT)
 * German prices are typically displayed including VAT
 */
export function calculateVATFromGross(grossPrice: number): VATCalculation {
  const netPrice = grossPrice / (1 + VAT_RATE)
  const vatAmount = grossPrice - netPrice
  
  return {
    grossPrice,
    netPrice,
    vatAmount,
    vatRate: VAT_RATE
  }
}

/**
 * Calculate gross price from net price
 */
export function calculateGrossFromNet(netPrice: number): VATCalculation {
  const vatAmount = netPrice * VAT_RATE
  const grossPrice = netPrice + vatAmount
  
  return {
    grossPrice,
    netPrice,
    vatAmount,
    vatRate: VAT_RATE
  }
}

/**
 * Format price with VAT information for display
 */
export function formatPriceWithVAT(price: number, lang: 'de' | 'en' = 'de'): {
  price: string
  vatInfo: string
} {
  const formatted = new Intl.NumberFormat(lang === 'de' ? 'de-DE' : 'en-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(price)

  const vatInfo = lang === 'de' 
    ? 'inkl. 19% MwSt.'
    : 'incl. 19% VAT'

  return {
    price: formatted,
    vatInfo
  }
}

/**
 * Calculate total VAT for cart items
 */
export function calculateCartVAT(items: Array<{ price: number; quantity: number }>): VATCalculation {
  const totalGross = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  return calculateVATFromGross(totalGross)
}