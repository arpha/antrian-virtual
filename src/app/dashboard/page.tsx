'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
    Play,
    SkipForward,
    RotateCcw,
    Users,
    Clock,
    CheckCircle2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore, useQueueStore } from '@/store/useStore'
import { useQueues } from '@/hooks/use-queues'
import { AddCustomerModal } from '@/components/dashboard/add-customer-modal'

export default function DashboardPage() {
    const { user } = useAuthStore()
    const { queues, currentQueue } = useQueueStore()
    const { loading, callNext, skipQueue, recallQueue, remindQueue } = useQueues(user?.id)
    const [isOpen, setIsOpen] = useState(false)
    const [merchant, setMerchant] = useState<any>(null)

    const fetchMerchantData = async () => {
        if (!user) return
        const { data } = await supabase
            .from('merchants')
            .select('*')
            .eq('id', user.id)
            .single()

        if (data) {
            setIsOpen(data.is_open)
            setMerchant(data)
        }
    }

    useEffect(() => {
        fetchMerchantData()

        // Listen for merchant profile changes (like avg_service_time updates)
        const channel = supabase
            .channel('merchant-updates')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'merchants',
                filter: `id=eq.${user?.id}`
            }, (payload) => {
                setIsOpen(payload.new.is_open)
                setMerchant(payload.new)
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user])

    const toggleOpen = async (checked: boolean) => {
        if (!user) return
        setIsOpen(checked)
        await supabase
            .from('merchants')
            .update({ is_open: checked })
            .eq('id', user.id)
    }

    const stats = {
        waiting: queues.filter(q => q.status === 'waiting').length,
        calling: queues.filter(q => q.status === 'calling').length,
        completed: queues.filter(q => q.status === 'completed').length,
    }

    const avgTime = merchant?.avg_service_time || 5

    const lastNumber = queues.length > 0
        ? Math.max(...queues.map(q => q.queue_number))
        : 0

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard Utama</h1>
                    <p className="text-muted-foreground">Monitor dan kelola antrean toko Anda.</p>
                </div>

                <div className="flex items-center gap-4 bg-white p-3 rounded-xl border-2 border-primary/5 shadow-sm">
                    <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                        <span className="text-sm font-semibold">{isOpen ? 'Toko Buka' : 'Toko Tutup'}</span>
                    </div>
                    <Switch
                        checked={isOpen}
                        onCheckedChange={toggleOpen}
                    />
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-md bg-white">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Menunggu</p>
                                <h3 className="text-3xl font-bold">{stats.waiting}</h3>
                            </div>
                            <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
                                <Users size={24} />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-4 italic">Pelanggan dalam daftar tunggu</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-white">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Waktu Tunggu Est.</p>
                                <h3 className="text-3xl font-bold">{stats.waiting * avgTime} Min</h3>
                            </div>
                            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center">
                                <Clock size={24} />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-4 italic">Asumsi {avgTime} menit per layanan</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-white">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Selesai Hari Ini</p>
                                <h3 className="text-3xl font-bold">{stats.completed}</h3>
                            </div>
                            <div className="w-12 h-12 bg-green-50 text-green-500 rounded-full flex items-center justify-center">
                                <CheckCircle2 size={24} />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-4 italic">Total antrean dilayani</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Controls Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Current Call Card */}
                <Card className="lg:col-span-2 border-2 border-primary/10 shadow-xl overflow-hidden">
                    <CardHeader className="bg-primary/5 border-b border-primary/10">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-bold">Sekarang Dipanggil</CardTitle>
                            <Badge variant="outline" className="bg-white px-3 py-1 text-primary border-primary/20">
                                Panggilan Aktif
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-6 min-h-[400px]">
                        {currentQueue ? (
                            <>
                                <div className="text-7xl md:text-9xl font-black text-primary tracking-tighter">
                                    {currentQueue.queue_number}
                                </div>
                                <div className="space-y-1">
                                    <p className="text-2xl font-bold">{currentQueue.customer_name}</p>
                                    <p className="text-muted-foreground">
                                        Dipanggil pada {new Date(currentQueue.called_at).toLocaleTimeString()}
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className="text-center space-y-4">
                                <div className="text-4xl font-bold text-gray-300">Belum Ada Antrean</div>
                                <p className="text-muted-foreground">Klik 'Panggil Selanjutnya' untuk memulai.</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mt-4">
                            <Button
                                size="lg"
                                className="h-16 gap-2 text-lg font-bold shadow-lg shadow-primary/20"
                                onClick={callNext}
                                disabled={loading || stats.waiting === 0}
                            >
                                <Play size={20} />
                                Panggil Selanjutnya
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="h-16 gap-2 border-2 hover:bg-gray-50"
                                onClick={recallQueue}
                                disabled={!currentQueue}
                            >
                                <RotateCcw size={20} />
                                Panggil Ulang
                            </Button>
                            <Button
                                size="lg"
                                variant="secondary"
                                className="h-16 gap-2 border-2 border-transparent"
                                onClick={skipQueue}
                                disabled={!currentQueue}
                            >
                                <SkipForward size={20} />
                                Lewati (Skip)
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions & Manual Add */}
                <div className="space-y-6">
                    <Card className="border-none shadow-md overflow-hidden">
                        <CardHeader className="bg-gray-50/50">
                            <CardTitle className="text-lg">Input Manual</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4 text-center">
                            <p className="text-sm text-muted-foreground">
                                Pelanggan tidak bawa HP atau gaptek? Masukkan datanya di sini.
                            </p>
                            {user && (
                                <AddCustomerModal merchantId={user.id} lastNumber={lastNumber} />
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-md overflow-hidden bg-gradient-to-br from-primary to-primary/80 text-white">
                        <CardContent className="p-6 space-y-4">
                            <h3 className="font-bold text-lg">Bagikan Antrean</h3>
                            <p className="text-sm text-primary-foreground/90">
                                Tunjukkan QR Code agar pelanggan bisa mengambil nomor sendiri.
                            </p>
                            <Button className="w-full bg-white text-primary hover:bg-gray-100 font-bold h-12">
                                Lihat QR Code Toko
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Waiting List Section */}
            <Card className="border-none shadow-md overflow-hidden mt-8">
                <CardHeader className="bg-gray-50/50">
                    <CardTitle className="text-xl">Daftar Tunggu Selanjutnya</CardTitle>
                    <p className="text-sm text-muted-foreground">Pelanggan yang sedang menunggu giliran.</p>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-xs uppercase tracking-wider text-muted-foreground border-b">
                                    <th className="px-6 py-4 font-semibold">No.</th>
                                    <th className="px-6 py-4 font-semibold">Nama Pelanggan</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                    <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {queues.filter(q => q.status === 'waiting').length > 0 ? (
                                    queues.filter(q => q.status === 'waiting').slice(0, 10).map((q) => (
                                        <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-primary">{q.queue_number}</td>
                                            <td className="px-6 py-4 font-medium">{q.customer_name}</td>
                                            <td className="px-6 py-4">
                                                <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-none">Menunggu</Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="gap-2 border-primary/20 hover:bg-primary/5 text-primary"
                                                    onClick={() => remindQueue(q)}
                                                >
                                                    <RotateCcw size={14} className="rotate-180" />
                                                    Ingatkan
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground italic">
                                            Tidak ada pelanggan dalam daftar tunggu.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
