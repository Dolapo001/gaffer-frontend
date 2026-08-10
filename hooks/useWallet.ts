import { useQuery } from '@tanstack/react-query'
import { getWallet } from '@/lib/services/payment.service'

export function useWallet() {
  return useQuery({
    queryKey: ['wallet'],
    queryFn: getWallet,
  })
}
