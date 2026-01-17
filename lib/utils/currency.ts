/**
 * Currency Conversion Utilities
 * Converts USD to INR and other currencies
 */

// Current USD to INR exchange rate (update this periodically or use an API)
// As of 2024, approximate rate: 1 USD ≈ 83 INR
// You can update this or fetch from an API
const USD_TO_INR_RATE = 83

/**
 * Convert USD to INR
 * @param usdAmount Amount in USD
 * @returns Amount in INR (rounded to 2 decimal places)
 */
export function convertUSDToINR(usdAmount: number): number {
  return Math.round(usdAmount * USD_TO_INR_RATE * 100) / 100 // Round to 2 decimal places
}

/**
 * Convert INR to USD
 * @param inrAmount Amount in INR
 * @returns Amount in USD (rounded to 2 decimal places)
 */
export function convertINRToUSD(inrAmount: number): number {
  return Math.round((inrAmount / USD_TO_INR_RATE) * 100) / 100 // Round to 2 decimal places
}

/**
 * Get current USD to INR exchange rate
 * @returns Exchange rate
 */
export function getUSDToINRRate(): number {
  return USD_TO_INR_RATE
}

/**
 * Convert amount from one currency to another
 * @param amount Amount to convert
 * @param fromCurrency Source currency
 * @param toCurrency Target currency
 * @returns Converted amount
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  if (fromCurrency === toCurrency) {
    return amount
  }

  // USD to INR
  if (fromCurrency === 'USD' && toCurrency === 'INR') {
    return convertUSDToINR(amount)
  }

  // INR to USD
  if (fromCurrency === 'INR' && toCurrency === 'USD') {
    return convertINRToUSD(amount)
  }

  // For other currencies, return as is (can be extended)
  return amount
}
