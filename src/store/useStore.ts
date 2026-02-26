import { create } from 'zustand'

interface QueueState {
    currentQueue: any | null
    queues: any[]
    setQueues: (queues: any[]) => void
    setCurrentQueue: (queue: any) => void
}

export const useQueueStore = create<QueueState>((set) => ({
    currentQueue: null,
    queues: [],
    setQueues: (queues) => set({ queues }),
    setCurrentQueue: (queue) => set({ currentQueue: queue }),
}))

interface AuthState {
    user: any | null
    merchant: any | null
    setUser: (user: any) => void
    setMerchant: (merchant: any) => void
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    merchant: null,
    setUser: (user) => set({ user }),
    setMerchant: (merchant) => set({ merchant }),
}))
