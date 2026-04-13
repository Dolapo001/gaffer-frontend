import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query'
import { ApiError, getErrorMessage } from '@/lib/api'
import { useToastStore } from '@/store/toastStore'

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (err: unknown) => {
      // 401 session errors are handled by the api client (token refresh / redirect)
      if (err instanceof ApiError && err.status === 401) return
      const message = getErrorMessage(err)
      useToastStore.getState().addToast({ message, type: 'error', duration: 5000 })
    }
  }),
  mutationCache: new MutationCache({
    onError: (err: unknown, _variables, _context, mutation) => {
      // 401 session errors are handled by the api client (token refresh / redirect)
      if (err instanceof ApiError && err.status === 401) return
      // Mutations that handle their own onError can set meta.suppressGlobalError = true
      // to avoid showing a duplicate global toast on top of their own inline error.
      if ((mutation.meta as Record<string, unknown> | undefined)?.suppressGlobalError) return
      const message = getErrorMessage(err)
      useToastStore.getState().addToast({ message, type: 'error', duration: 5000 })
    }
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,  // 5 minutes
      gcTime:    1000 * 60 * 10, // 10 minutes
      retry: (failureCount, err) => {
        // Don't retry auth / permission errors
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) return false
        return failureCount < 2
      },
    },
  },
})
