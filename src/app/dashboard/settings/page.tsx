'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/useStore'
import { useToast } from '@/hooks/use-toast'
import { QRCodeCanvas } from 'qrcode.react'
import { Download, Save, QrCode as QrIcon } from 'lucide-react'

export default function SettingsPage() {
    const { user } = useAuthStore()
    const [merchant, setMerchant] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const { toast } = useToast()
    const qrRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const fetchMerchant = async () => {
            if (!user) return
            const { data } = await supabase
                .from('merchants')
                .select('*')
                .eq('id', user.id)
                .single()

            if (data) setMerchant(data)
            setLoading(false)
        }
        fetchMerchant()
    }, [user])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        const { error } = await supabase
            .from('merchants')
            .update({
                shop_name: merchant.shop_name,
                shop_slug: merchant.shop_slug,
                is_open: merchant.is_open,
                avg_service_time: merchant.avg_service_time || 5,
            })
            .eq('id', user?.id)

        if (error) {
            toast({
                title: 'Gagal menyimpan',
                description: error.message,
                variant: 'destructive'
            })
        } else {
            toast({ title: 'Pengaturan disimpan' })
        }
        setSaving(false)
    }

    const downloadQR = () => {
        const canvas = qrRef.current?.querySelector('canvas')
        if (canvas) {
            const url = canvas.toDataURL('image/png')
            const link = document.createElement('a')
            link.download = `QR_Antrean_${merchant.shop_name}.png`
            link.href = url
            link.click()
        }
    }

    if (loading) return <div>Memuat...</div>
    if (!merchant) return <div>Data merchant tidak ditemukan. Pastikan Anda sudah terdaftar dengan benar.</div>

    const publicUrl = `${window.location.origin}/q/${merchant.shop_slug}`

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Pengaturan Toko</h1>
                <p className="text-muted-foreground">Kelola profil toko dan QR Code antrean Anda.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informasi Toko</CardTitle>
                            <CardDescription>Update nama dan alamat unik toko Anda.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSave} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nama Toko</label>
                                    <Input
                                        value={merchant.shop_name}
                                        onChange={(e) => setMerchant({ ...merchant, shop_name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Link Unik (Slug)</label>
                                    <div className="flex gap-2">
                                        <span className="flex items-center px-3 bg-gray-100 rounded-lg text-xs text-muted-foreground border">/q/</span>
                                        <Input
                                            value={merchant.shop_slug}
                                            onChange={(e) => setMerchant({ ...merchant, shop_slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                        />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground italic">Link ini yang akan digunakan pelanggan untuk mendaftar antrean.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Waktu Layanan Rata-rata (Menit)</label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={merchant.avg_service_time || 5}
                                        onChange={(e) => setMerchant({ ...merchant, avg_service_time: parseInt(e.target.value) })}
                                    />
                                    <p className="text-[10px] text-muted-foreground italic">Gunakan ini untuk menghitung estimasi waktu tunggu pelanggan secara otomatis.</p>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border">
                                    <div>
                                        <p className="font-bold text-sm">Status Pengambilan Antrean</p>
                                        <p className="text-xs text-muted-foreground">Buka/tutup akses pendaftaran antrean bagi pelanggan.</p>
                                    </div>
                                    <Switch
                                        checked={merchant.is_open}
                                        onCheckedChange={(checked) => setMerchant({ ...merchant, is_open: checked })}
                                    />
                                </div>

                                <Button type="submit" className="w-full gap-2" disabled={saving}>
                                    <Save size={18} />
                                    {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="overflow-hidden border-2 border-primary/10">
                        <CardHeader className="bg-primary/5 text-center">
                            <CardTitle className="text-lg">QR Code Antrean</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 flex flex-col items-center gap-6">
                            <div ref={qrRef} className="p-4 bg-white rounded-2xl shadow-inner border">
                                <QRCodeCanvas
                                    value={publicUrl}
                                    size={160}
                                    level="H"
                                    includeMargin={true}
                                    imageSettings={{
                                        src: "/logo-black.png",
                                        x: undefined,
                                        y: undefined,
                                        height: 24,
                                        width: 24,
                                        excavate: true,
                                    }}
                                />
                            </div>
                            <div className="text-center space-y-2">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Scan untuk daftar</p>
                                <p className="text-[10px] text-primary underline truncate max-w-[180px]">{publicUrl}</p>
                            </div>
                            <Button variant="outline" className="w-full gap-2 font-bold" onClick={downloadQR}>
                                <Download size={18} />
                                Cetak / Download
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
