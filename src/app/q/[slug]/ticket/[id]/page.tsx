'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { supabase } from '@/lib/supabase'
import { Bell, Clock, Info, Smartphone, Share2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function DigitalTicketPage() {
    const params = useParams()
    const shopSlug = params.slug as string
    const queueIdFromUrl = params.id as string
    const [queue, setQueue] = useState<any>(null)
    const [merchant, setMerchant] = useState<any>(null)
    const [currentCalling, setCurrentCalling] = useState<number | null>(null)
    const [isAudioEnabled, setIsAudioEnabled] = useState(false)
    const [isAlarmPlaying, setIsAlarmPlaying] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const vibrateInterval = useRef<any>(null)
    const router = useRouter()
    const { toast } = useToast()

    const fetchInitialData = async (queueId: string) => {
        const { data: qData } = await supabase
            .from('queues')
            .select('*')
            .eq('id', queueId)
            .single()

        if (qData) {
            setQueue(qData)
            // Fetch merchant
            const { data: mData } = await supabase
                .from('merchants')
                .select('*')
                .eq('id', qData.merchant_id)
                .single()
            setMerchant(mData)

            // Initial Alarm Check if already calling
            if (qData.status === 'calling') {
                setIsAlarmPlaying(true)
            }

            // Fetch current calling
            const { data: currentCallee } = await supabase
                .from('queues')
                .select('queue_number')
                .eq('merchant_id', qData.merchant_id)
                .eq('status', 'calling')
                .order('called_at', { ascending: false })
                .limit(1)
                .maybeSingle()

            setCurrentCalling(currentCallee?.queue_number || 0)
            return qData.merchant_id
        }
        return null
    }

    useEffect(() => {
        if (!queueIdFromUrl) {
            router.push(`/q/${shopSlug}`)
            return
        }

        let merchantId: string

        fetchInitialData(queueIdFromUrl).then(id => {
            if (id) {
                merchantId = id

                // Realtime subscription
                const channel = supabase
                    .channel(`ticket-${queueIdFromUrl}`)
                    .on('postgres_changes', {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'queues',
                        filter: `merchant_id=eq.${id}`
                    }, (payload) => {
                        if (payload.new.id === queueIdFromUrl) {
                            setQueue(payload.new)
                            if (payload.new.status === 'calling') {
                                setIsAlarmPlaying(true)
                            } else {
                                stopAlarm()
                            }
                        }
                        if (payload.new.status === 'calling') {
                            setCurrentCalling(payload.new.queue_number)
                        }
                    })
                    .subscribe()

                return () => {
                    supabase.removeChannel(channel)
                }
            } else {
                router.push(`/q/${shopSlug}`)
            }
        })

    }, [shopSlug, queueIdFromUrl])

    useEffect(() => {
        if (isAlarmPlaying && isAudioEnabled) {
            startAlarm()
        } else if (!isAlarmPlaying) {
            stopAlarm()
        }
    }, [isAlarmPlaying, isAudioEnabled])

    const startAlarm = () => {
        if (audioRef.current) {
            audioRef.current.loop = true
            audioRef.current.play().catch(e => console.log("Audio play failed:", e))
        }

        // Vibration pattern
        if ("vibrate" in navigator) {
            navigator.vibrate([500, 300, 500, 300, 500])
            vibrateInterval.current = setInterval(() => {
                navigator.vibrate([500, 300, 500])
            }, 2000)
        }
    }

    const stopAlarm = () => {
        setIsAlarmPlaying(false)
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.currentTime = 0
        }
        if (vibrateInterval.current) {
            clearInterval(vibrateInterval.current)
        }
        if ("vibrate" in navigator) {
            navigator.vibrate(0)
        }
    }

    const enableAudio = () => {
        setIsAudioEnabled(true)
        // Dummy play to unlock audio on mobile
        if (audioRef.current) {
            audioRef.current.play().then(() => {
                audioRef.current?.pause()
                audioRef.current!.currentTime = 0
            }).catch(() => { })
        }
    }

    const handleShare = () => {
        const url = window.location.href
        navigator.clipboard.writeText(url)
        toast({
            title: "Link disalin!",
            description: "Bagikan link ini ke orang lain untuk memantau antrean Anda.",
        })
    }

    if (!queue || !merchant) return <div className="flex items-center justify-center min-h-screen">Loading tiket...</div>

    const isCalling = queue.status === 'calling'
    const isCompleted = queue.status === 'completed'
    const isSkipped = queue.status === 'skipped'

    const peopleAhead = Math.max(0, queue.queue_number - (currentCalling || 0))
    const progressPercent = currentCalling ? Math.min(100, (currentCalling / queue.queue_number) * 100) : 0

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex flex-col items-center">
            <audio ref={audioRef} src="/notification.mp3" preload="auto" />

            <div className="w-full max-w-md space-y-6">
                {!isAudioEnabled && !isCompleted && !isSkipped && (
                    <div className="bg-amber-100 border-2 border-amber-200 p-4 rounded-2xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex items-center gap-3">
                            <Bell className="text-amber-600 animate-swing" size={24} />
                            <div>
                                <p className="text-xs font-bold text-amber-900 leading-tight">Aktifkan Alarm</p>
                                <p className="text-[10px] text-amber-700">Agar HP berdering saat dipanggil.</p>
                            </div>
                        </div>
                        <Button size="sm" onClick={enableAudio} className="bg-amber-600 hover:bg-amber-700 font-bold shrink-0">
                            Aktifkan
                        </Button>
                    </div>
                )}

                <header className="flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Antrean Anda di</h2>
                        <h1 className="text-2xl font-black text-primary">{merchant.shop_name}</h1>
                    </div>
                    <Badge variant={isCompleted ? "default" : "outline"} className={`h-10 px-4 rounded-full text-sm font-bold ${isCalling ? 'bg-primary text-white border-primary' : ''}`}>
                        {isCalling ? '👉 SEDANG DIPANGGIL' : isCompleted ? '✅ SELESAI' : isSkipped ? '❌ DILEWATI' : '⏳ MENUNGGU'}
                    </Badge>
                </header>

                <Card className={`border-none shadow-2xl overflow-hidden rounded-[2.5rem] transition-all duration-500 ${isCalling ? 'ring-4 ring-primary ring-offset-4 scale-[1.02]' : ''}`}>
                    <div className={`p-8 text-center space-y-4 ${isCalling ? 'bg-primary text-white' : 'bg-white'}`}>
                        <p className={`text-sm font-bold tracking-widest uppercase ${isCalling ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                            Nomor Antrean
                        </p>
                        <h2 className="text-8xl md:text-9xl font-black tracking-tighter">
                            {queue.queue_number}
                        </h2>
                        <div className="pt-2">
                            <p className="text-lg font-bold">{queue.customer_name}</p>
                            {isCalling && (
                                <div className="space-y-4 mt-4">
                                    <p className="text-sm animate-bounce font-bold tracking-wide">SILAKAN MENUJU LOKET!</p>
                                    <Button
                                        size="lg"
                                        onClick={stopAlarm}
                                        className="w-full bg-white text-primary hover:bg-gray-100 font-black py-8 rounded-2xl shadow-xl animate-pulse"
                                    >
                                        MATIKAN ALARM / SAYA DATANG
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {!isCalling && (
                        <CardContent className="p-8 bg-white space-y-8 border-t border-gray-100">
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm font-bold">
                                    <span>Posisi Sekarang: {currentCalling || '-'}</span>
                                    <span>Target: {queue.queue_number}</span>
                                </div>
                                <Progress value={progressPercent} className="h-3 bg-gray-100" />
                                <p className="text-center text-xs font-medium text-muted-foreground pt-1">
                                    {isCompleted ? 'Layanan Anda telah selesai.' : peopleAhead > 0 ? `${peopleAhead} orang lagi sebelum giliran Anda.` : 'Anda adalah urutan berikutnya!'}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-2xl flex flex-col items-center justify-center text-center space-y-1">
                                    <Clock size={20} className="text-primary" />
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Estimasi Tunggu</span>
                                    <span className="font-bold">{isCompleted ? '0' : peopleAhead * (merchant.avg_service_time || 5)} Menit</span>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-2xl flex flex-col items-center justify-center text-center space-y-1">
                                    <Bell size={20} className={isAudioEnabled ? "text-primary" : "text-gray-400"} />
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Alarm</span>
                                    <span className="font-bold">{isAudioEnabled ? 'Aktif' : 'Off'}</span>
                                </div>
                            </div>
                        </CardContent>
                    )}
                </Card>

                {/* Promo / Info Area */}
                <Card className="bg-primary/5 border-dashed border-2 border-primary/20 rounded-3xl p-6">
                    <div className="flex gap-4">
                        <Info className="text-primary shrink-0" />
                        <div className="space-y-1">
                            <h4 className="font-bold text-sm">Penting!</h4>
                            <p className="text-xs text-muted-foreground italic">Jangan tutup halaman ini agar alarm bisa berbunyi saat dipanggil.</p>
                        </div>
                    </div>
                </Card>

                <div className="flex justify-center gap-6 pt-4 text-muted-foreground">
                    <button
                        onClick={handleShare}
                        className="flex flex-col items-center gap-1 hover:text-primary transition-colors"
                    >
                        <Share2 size={24} />
                        <span className="text-[10px] font-bold">Bagikan</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 hover:text-primary transition-colors">
                        <Smartphone size={24} />
                        <span className="text-[10px] font-bold">Simpan</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
