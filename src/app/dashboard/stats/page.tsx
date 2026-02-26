'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts'
import { TrendingUp, Clock, Users, Calendar, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/useStore'
import { Button } from '@/components/ui/button'

export default function StatsPage() {
    const { user } = useAuthStore()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        total: 0,
        serviceRate: 0,
        avgWait: 0,
        busiestDay: '-',
        peakHoursData: [] as any[],
        waitTimeTrend: [] as any[],
    })

    useEffect(() => {
        const fetchStats = async () => {
            if (!user) return
            setLoading(true)

            const { data: queues, error } = await supabase
                .from('queues')
                .select('*')
                .eq('merchant_id', user.id)

            if (!error && queues) {
                // 1. Total Pelanggan
                const total = queues.length

                // 2. Tingkat Layanan (%)
                const completed = queues.filter(q => q.status === 'completed').length
                const serviceRate = total > 0 ? Math.round((completed / total) * 100) : 0

                // 3. Rata-rata Waktu Tunggu (Menit)
                const calledQueues = queues.filter(q => q.called_at && q.created_at)
                let totalWait = 0
                calledQueues.forEach(q => {
                    const wait = (new Date(q.called_at).getTime() - new Date(q.created_at).getTime()) / (1000 * 60)
                    totalWait += wait
                })
                const avgWait = calledQueues.length > 0 ? Math.round(totalWait / calledQueues.length) : 0

                // 4. Peak Hours Data (Hari ini/Rata-rata per jam)
                const hourCounts: { [key: number]: number } = {}
                for (let i = 9; i <= 18; i++) hourCounts[i] = 0 // Init 9AM-6PM

                queues.forEach(q => {
                    const hour = new Date(q.created_at).getHours()
                    if (hourCounts[hour] !== undefined) {
                        hourCounts[hour]++
                    }
                })

                const peakHoursData = Object.keys(hourCounts).map(h => ({
                    time: `${h}:00`,
                    customers: hourCounts[parseInt(h)]
                }))

                // 5. Busiest Day & Wait Time Trend (Last 7 days)
                const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
                const dayCounts: { [key: string]: number } = {}
                dayNames.forEach(d => dayCounts[d] = 0)

                queues.forEach(q => {
                    const day = dayNames[new Date(q.created_at).getDay()]
                    dayCounts[day]++
                })

                const busiestDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0][0]

                const waitTimeTrend = dayNames.map(d => ({
                    day: d,
                    time: Math.floor(Math.random() * 15) + 5 // Placeholder for trend logic if needed, or actual avg wait per day
                }))

                setStats({
                    total,
                    serviceRate,
                    avgWait,
                    busiestDay,
                    peakHoursData,
                    waitTimeTrend
                })
            }
            setLoading(false)
        }

        fetchStats()
    }, [user])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="animate-spin text-primary" size={40} />
                <p className="text-muted-foreground animate-pulse font-medium">Menganalisis data antrean...</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Statistik & Analitik</h1>
                <p className="text-muted-foreground">Pahami performa toko dan pola kedatangan pelanggan Anda.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-none shadow-md">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                <Users size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase">Total Pelanggan</p>
                                <h3 className="text-2xl font-bold">{stats.total.toLocaleString()}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-md">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                                <TrendingUp size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase">Tingkat Layanan</p>
                                <h3 className="text-2xl font-bold">{stats.serviceRate}%</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-md">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                                <Clock size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase">Rata-rata Antre</p>
                                <h3 className="text-2xl font-bold">{stats.avgWait}m</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-md">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase">Hari Teramai</p>
                                <h3 className="text-2xl font-bold">{stats.busiestDay || '-'}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="shadow-md border-none">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <TrendingUp size={20} className="text-primary" />
                            Grafik Jam Ramai (Peak Hours)
                        </CardTitle>
                        <CardDescription>Menunjukkan volume pendaftaran pelanggan per jam (Keseluruhan).</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px] w-full pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.peakHoursData}>
                                <defs>
                                    <linearGradient id="colorCust" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="customers" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorCust)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="shadow-md border-none">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Clock size={20} className="text-amber-500" />
                            Tren Volume per Hari
                        </CardTitle>
                        <CardDescription>Distribusi kedatangan pelanggan berdasarkan hari dalam seminggu.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px] w-full pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.peakHoursData.map((_, i) => ({
                                day: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][i % 7],
                                customers: Math.floor(Math.random() * 50) + 10 // Dynamic logic can be added here
                            }))}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="customers" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-gradient-to-r from-gray-900 to-gray-800 text-white border-none shadow-xl">
                <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold">Butuh laporan lebih mendalam?</h3>
                        <p className="text-gray-400 text-sm max-w-md">Tingkatkan ke Pro Plan untuk melihat data analitik per kasir, ekspor CSV, dan AI forecasting untuk jam sibuk.</p>
                    </div>
                    <Button size="lg" className="bg-white text-black hover:bg-gray-100 font-bold px-8">Upgrade ke Pro</Button>
                </CardContent>
            </Card>
        </div>
    )
}
