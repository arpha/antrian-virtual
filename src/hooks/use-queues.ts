import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useQueueStore } from '@/store/useStore'

export function useQueues(merchantId: string | undefined) {
    const { queues, setQueues, currentQueue, setCurrentQueue } = useQueueStore()
    const [loading, setLoading] = useState(true)

    const fetchQueues = async () => {
        if (!merchantId) return

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        setLoading(true)
        const { data, error } = await supabase
            .from('queues')
            .select('*')
            .eq('merchant_id', merchantId)
            .gte('created_at', today.toISOString())
            .order('created_at', { ascending: true })

        if (!error && data) {
            setQueues(data)
            // Find current calling queue
            const calling = data.find(q => q.status === 'calling' || q.status === 'serving')
            setCurrentQueue(calling || null)
        }
        setLoading(false)
    }

    useEffect(() => {
        if (!merchantId) return

        fetchQueues()

        // Subscribe to real-time changes
        const channel = supabase
            .channel('schema-db-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'queues',
                    filter: `merchant_id=eq.${merchantId}`
                },
                () => {
                    fetchQueues()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [merchantId])

    const sendWhatsApp = async (to: string, name: string, number: number) => {
        try {
            await fetch('/api/whatsapp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: to,
                    message: `Halo ${name}! Nomor antrean Anda ${number} segera tiba. Mohon segera kembali ke area toko. Terima kasih!`
                })
            })
        } catch (e) {
            console.error("Failed to send WA:", e)
        }
    }

    const callNext = async () => {
        if (!merchantId) return

        const nextQueue = queues.find(q => q.status === 'waiting')
        if (!nextQueue) return

        if (currentQueue) {
            await supabase
                .from('queues')
                .update({ status: 'completed' })
                .eq('id', currentQueue.id)
        }

        const { error } = await supabase
            .from('queues')
            .update({
                status: 'calling',
                called_at: new Date().toISOString()
            })
            .eq('id', nextQueue.id)

        if (!error) {
            sendWhatsApp(nextQueue.whatsapp_number, nextQueue.customer_name, nextQueue.queue_number)
        }
    }

    const recallQueue = async () => {
        if (!currentQueue) return
        await supabase
            .from('queues')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', currentQueue.id)

        sendWhatsApp(currentQueue.whatsapp_number, currentQueue.customer_name, currentQueue.queue_number)
    }

    const skipQueue = async () => {
        if (!currentQueue) return
        await supabase
            .from('queues')
            .update({ status: 'skipped' })
            .eq('id', currentQueue.id)
    }

    const remindQueue = async (queue: any) => {
        try {
            await fetch('/api/whatsapp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: queue.whatsapp_number,
                    message: `Halo ${queue.customer_name}! Nomor antrean Anda ${queue.queue_number} sebentar lagi akan dipanggil. Mohon mulai mendekati area toko agar tidak terlewat. Terima kasih!`
                })
            })
            await supabase
                .from('queues')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', queue.id)
        } catch (e) {
            console.error("Failed to send reminder:", e)
        }
    }

    return { loading, callNext, skipQueue, recallQueue, remindQueue }
}
