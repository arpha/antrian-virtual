'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const { toast } = useToast()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            toast({
                title: 'Login Gagal',
                description: error.message,
                variant: 'destructive',
            })
        } else {
            router.push('/dashboard')
        }
        setLoading(false)
    }

    const handleRegister = async (e: React.MouseEvent) => {
        e.preventDefault()

        if (!email || !password) {
            toast({
                title: 'Data tidak lengkap',
                description: 'Silakan isi email dan password terlebih dahulu.',
                variant: 'destructive',
            })
            return
        }

        setLoading(true)

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: email.split('@')[0], // Default name from email
                }
            }
        })

        if (error) {
            toast({
                title: 'Pendaftaran Gagal',
                description: error.message,
                variant: 'destructive',
            })
        } else {
            toast({
                title: 'Pendaftaran Berhasil',
                description: 'Silakan cek email Anda untuk verifikasi atau langsung login jika sudah aktif.',
            })
        }
        setLoading(false)
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
            <Card className="w-full max-w-md shadow-lg border-2 border-primary/10">
                <CardHeader className="space-y-1 text-center font-bold">
                    <CardTitle className="text-3xl text-primary">Antrean Virtual</CardTitle>
                    <CardDescription>
                        Masuk sebagai Pemilik Toko untuk mengelola antrean
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <Input
                                type="email"
                                placeholder="email@toko.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Password</label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3">
                        <Button type="submit" className="w-full font-bold text-md h-12" disabled={loading}>
                            {loading ? 'Memproses...' : 'Masuk Dashboard'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={(e) => handleRegister(e as any)}
                            disabled={loading}
                        >
                            Daftar Akun Baru
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
