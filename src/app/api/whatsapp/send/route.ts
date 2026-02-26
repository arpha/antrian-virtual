import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const { to, message } = await req.json()

        if (!process.env.FONNTE_TOKEN) {
            return NextResponse.json({ error: 'Fonnte Token not configured' }, { status: 500 })
        }

        const response = await fetch('https://api.fonnte.com/send', {
            method: 'POST',
            headers: {
                'Authorization': process.env.FONNTE_TOKEN,
            },
            body: new URLSearchParams({
                target: to,
                message: message,
                countryCode: '62', // Default to Indonesia
            }),
        })

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
