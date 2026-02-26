'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export function AddCustomerModal({ merchantId, lastNumber }: { merchantId: string, lastNumber: number }) {
    const [name, setName] = useState('')
    const [wa, setWa] = useState('')
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)
    const { toast } = useToast()

    const handleAdd = async () => {
        setLoading(true)
        const { error } = await supabase.from('queues').insert({
            merchant_id: merchantId,
            customer_name: name,
            whatsapp_number: wa,
            queue_number: lastNumber + 1,
            status: 'waiting'
        })

        if (error) {
            toast({
                title: 'Gagal menambah pelanggan',
                description: error.message,
                variant: 'destructive'
            })
        } else {
            toast({
                title: 'Pelanggan ditambahkan',
                description: `${name} telah masuk ke dalam antrean.`
            })
            setName('')
            setWa('')
            setOpen(false)
        }
        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="w-full gap-2 h-12 font-semibold" variant="outline">
                    <Plus size={18} />
                    Tambah Pelanggan Baru
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Input Pelanggan Manual</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Nama Pelanggan</label>
                        <Input
                            placeholder="Masukkan nama..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">No. WhatsApp</label>
                        <Input
                            placeholder="0812..."
                            value={wa}
                            onChange={(e) => setWa(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleAdd} disabled={loading || !name}>
                        {loading ? 'Menyimpan...' : 'Simpan ke Antrean'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
