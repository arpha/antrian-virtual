'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { QrCode, User, Phone } from 'lucide-react'

export default function CustomerCheckInPage() {
    const params = useParams()
    const shopSlug = params.slug as string
    const [merchant, setMerchant] = useState<any>(null)
    const [name, setName] = useState('')
    const [wa, setWa] = useState('')
    const [loading, setLoading] = useState(false)
    const [searching, setSearching] = useState(true)
    const router = useRouter()
    const { toast } = useToast()

    useEffect(() => {
        const fetchMerchant = async () => {
            const { data, error } = await supabase
                .from('merchants')
                .select('*')
                .eq('shop_slug', shopSlug)
                .single()

            if (data) setMerchant(data)
            setSearching(false)
        }
        fetchMerchant()
    }, [shopSlug])

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!merchant) return

        setLoading(true)

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Get last number for TODAY
        const { data: lastQueue } = await supabase
            .from('queues')
            .select('queue_number')
            .eq('merchant_id', merchant.id)
            .gte('created_at', today.toISOString())
            .order('queue_number', { ascending: false })
            .limit(1)
            .maybeSingle()

        const nextNumber = (lastQueue?.queue_number || 0) + 1

        const { data: newQueue, error } = await supabase
            .from('queues')
            .insert({
                merchant_id: merchant.id,
                customer_name: name,
                whatsapp_number: wa,
                queue_number: nextNumber,
                status: 'waiting'
            })
            .select()
            .single()

        if (error) {
            toast({
                title: 'Gagal mengambil nomor',
                description: error.message,
                variant: 'destructive',
            })
        } else {
            // Save queue ID to local storage to persist session
            localStorage.setItem(`queue_${shopSlug}`, newQueue.id)
            router.push(`/q/${shopSlug}/ticket`)
        }
        setLoading(false)
    }

    if (searching) return <div className="flex items-center justify-center min-h-screen">Mencari toko...</div>

    if (!merchant) return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
            <h2 className="text-2xl font-bold">Toko Tidak Ditemukan</h2>
            <p className="text-muted-foreground">Pastikan QR Code yang Anda scan benar.</p>
        </div>
    )

    return (
        <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-none shadow-2xl overflow-hidden rounded-3xl">
                <CardHeader className="bg-primary text-white p-8 text-center space-y-4">
                    <div className="w-20 h-20 bg-white/20 rounded-2xl mx-auto flex items-center justify-center backdrop-blur-sm">
                        <QrCode size={40} />
                    </div>
                    <div>
                        <CardTitle className="text-3xl font-black italic tracking-tight">{merchant.shop_name}</CardTitle>
                        <CardDescription className="text-primary-foreground/80 font-medium">
                            Ambil nomor antrean Anda secara digital
                        </CardDescription>
                    </div>
                </CardHeader>

                <form onSubmit={handleRegister}>
                    <CardContent className="p-8 space-y-6">
                        {!merchant.is_open && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold text-center border border-red-100">
                                PENGAMBILAN ANTREAN SEDANG DITUTUP
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                    <User size={16} className="text-primary" /> Nama Lengkap
                                </label>
                                <Input
                                    placeholder="Masukkan nama Anda..."
                                    className="h-14 rounded-xl border-gray-200 focus:ring-primary"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={!merchant.is_open}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                    <Phone size={16} className="text-primary" /> No. WhatsApp
                                </label>
                                <Input
                                    type="tel"
                                    placeholder="0812xxxxxx"
                                    className="h-14 rounded-xl border-gray-200"
                                    value={wa}
                                    onChange={(e) => setWa(e.target.value)}
                                    disabled={!merchant.is_open}
                                    required
                                />
                                <p className="text-[10px] text-muted-foreground px-1">
                                    *Kami akan mengirim pengingat saat giliran Anda tiba.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="p-8 pt-0">
                        <Button
                            type="submit"
                            className="w-full h-16 text-lg font-black rounded-2xl shadow-xl shadow-primary/20 transition-transform active:scale-95"
                            disabled={loading || !merchant.is_open}
                        >
                            {loading ? 'Memproses...' : 'AMBIL NOMOR SEKARANG'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
