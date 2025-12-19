import { useState, useEffect } from 'react'

export function useRestockDate(productId: string, variantId?: string) {
  const [restockDate, setRestockDate] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRestockDate = async () => {
      if (!productId) return

      try {
        const params = new URLSearchParams({
          productId,
          ...(variantId && { variantId })
        })

        const response = await fetch(`/api/admin/restock-dates?${params}`)
        if (response.ok) {
          const data = await response.json()
          if (data.expectedRestockDate) {
            setRestockDate(new Date(data.expectedRestockDate))
          }
        }
      } catch (error) {
        console.error('Error fetching restock date:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRestockDate()
  }, [productId, variantId])

  return { restockDate, loading }
}