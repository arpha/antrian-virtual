'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    Search,
    Filter,
    Trash2,
    CheckCircle2,
    XCircle,
    Clock,
    MoreVertical
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/useStore'
import { useToast } from '@/hooks/use-toast'

export default function QueuesManagementPage() {
    const { user } = useAuthStore()
    const [queues, setQueues] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const { toast } = useToast()

    const fetchQueues = async () => {
        if (!user) return
        setLoading(true)

        let query = supabase
            .from('queues')
            .select('*')
            .eq('merchant_id', user.id)
            .order('created_at', { ascending: false })

        if (statusFilter !== 'all') {
            query = query.eq('status', statusFilter)
        }

        const { data, error } = await query

        if (!error && data) {
            setQueues(data)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchQueues()
    }, [user, statusFilter])

    const updateStatus = async (id: string, newStatus: string) => {
        const { error } = await supabase
            .from('queues')
            .update({ status: newStatus })
            .eq('id', id)

        if (error) {
            toast({ title: 'Gagal update', description: error.message, variant: 'destructive' })
        } else {
            toast({ title: 'Status diperbarui' })
            fetchQueues()
        }
    }

    const deleteQueue = async (id: string) => {
        if (!confirm('Hapus antrean ini?')) return

        const { error } = await supabase
            .from('queues')
            .delete()
            .eq('id', id)

        if (error) {
            toast({ title: 'Gagal menghapus', description: error.message, variant: 'destructive' })
        } else {
            toast({ title: 'Antrean dihapus' })
            fetchQueues()
        }
    }

    const filteredQueues = queues.filter(q =>
        q.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.queue_number.toString().includes(searchTerm)
    )

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'waiting': return <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-none">Menunggu</Badge>
            case 'calling': return <Badge variant="secondary" className="bg-amber-50 text-amber-600 border-none animate-pulse">Memanggil</Badge>
            case 'serving': return <Badge variant="secondary" className="bg-green-50 text-green-600 border-none">Melayani</Badge>
            case 'skipped': return <Badge variant="secondary" className="bg-red-50 text-red-600 border-none">Dilewati</Badge>
            case 'completed': return <Badge variant="secondary" className="bg-gray-100 text-gray-600 border-none">Selesai</Badge>
            default: return <Badge>{status}</Badge>
        }
    }

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Manajemen Antrean</h1>
                <p className="text-muted-foreground">Lihat riwayat dan kelola status antrean secara mendetail.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                        placeholder="Cari nama atau nomor..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Filter size={18} className="text-gray-400" />
                    <select
                        className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Semua Status</option>
                        <option value="waiting">Menunggu</option>
                        <option value="calling">Memanggil</option>
                        <option value="completed">Selesai</option>
                        <option value="skipped">Dilewati</option>
                    </select>
                    <Button variant="outline" size="icon" onClick={fetchQueues} disabled={loading}>
                        <RotateCcw size={18} className={loading ? 'animate-spin' : ''} />
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-lg overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 text-xs uppercase tracking-wider text-muted-foreground border-b border-gray-100">
                                    <th className="px-6 py-4 font-semibold">No.</th>
                                    <th className="px-6 py-4 font-semibold">Nama Pelanggan</th>
                                    <th className="px-6 py-4 font-semibold">Waktu Masuk</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                    <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">Memuat data...</td>
                                    </tr>
                                ) : filteredQueues.length > 0 ? (
                                    filteredQueues.map((q) => (
                                        <tr key={q.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-primary">#{q.queue_number}</span>
                                            </td>
                                            <td className="px-6 py-4 font-medium">{q.customer_name}</td>
                                            <td className="px-6 py-4 text-sm text-muted-foreground">
                                                <div className="flex flex-col">
                                                    <span>{new Date(q.created_at).toLocaleDateString()}</span>
                                                    <span className="text-xs">{new Date(q.created_at).toLocaleTimeString()}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">{getStatusBadge(q.status)}</td>
                                            <td className="px-6 py-4 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreVertical size={18} />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48">
                                                        <DropdownMenuItem onClick={() => updateStatus(q.id, 'completed')} className="gap-2">
                                                            <CheckCircle2 size={16} className="text-green-500" /> Tandai Selesai
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => updateStatus(q.id, 'skipped')} className="gap-2">
                                                            <XCircle size={16} className="text-red-500" /> Tandai Terlewat
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => updateStatus(q.id, 'waiting')} className="gap-2">
                                                            <Clock size={16} className="text-blue-500" /> Reset ke Tunggu
                                                        </DropdownMenuItem>
                                                        <div className="h-px bg-gray-100 my-1" />
                                                        <DropdownMenuItem onClick={() => deleteQueue(q.id)} className="gap-2 text-red-600">
                                                            <Trash2 size={16} /> Hapus Data
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">
                                            Tidak ditemukan data antrean.
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

function RotateCcw({ size, className }: { size: number, className: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
        </svg>
    )
}
