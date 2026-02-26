'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
    LayoutDashboard,
    Settings,
    LogOut,
    Users,
    BarChart3,
    Menu,
    X,
    Store
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/useStore'

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Manajemen Antrean', href: '/dashboard/queues', icon: Users },
    { name: 'Statistik', href: '/dashboard/stats', icon: BarChart3 },
    { name: 'Pengaturan Toko', href: '/dashboard/settings', icon: Settings },
]

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const router = useRouter()
    const pathname = usePathname()
    const { user, setUser } = useAuthStore()

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                router.push('/login')
            } else {
                setUser(session.user)
            }
        })
    }, [router, setUser])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        setUser(null)
        router.push('/login')
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed md:static inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
                <div className="h-full flex flex-col">
                    <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg">
                            <Store size={24} />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-primary">AntreanV</span>
                    </div>

                    <nav className="flex-1 p-4 space-y-1">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                    ${isActive
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-gray-600 hover:bg-gray-100'}
                  `}
                                >
                                    <item.icon size={20} />
                                    {item.name}
                                </Link>
                            )
                        })}
                    </nav>

                    <div className="p-4 border-t border-gray-100">
                        <Button
                            variant="ghost"
                            className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={handleLogout}
                        >
                            <LogOut size={20} />
                            Keluar
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 md:px-8">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu size={24} />
                    </Button>

                    <div className="flex items-center gap-4 ml-auto">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold">{user?.email}</p>
                            <p className="text-xs text-muted-foreground">Merchant</p>
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-6 md:p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}
