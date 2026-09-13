import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

    const authHeader = req.headers.get('authorization')
    const demoMode = req.headers.get('x-demo-mode')
    const demoRole = req.headers.get('x-demo-role')
    const userId = req.headers.get('x-user-id')

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (authHeader) headers['authorization'] = authHeader
    if (demoMode) headers['x-demo-mode'] = demoMode
    if (demoRole) headers['x-demo-role'] = demoRole
    if (userId) headers['x-user-id'] = userId

    const res = await fetch(`${backendUrl}/api/verification/requests/${id}/test/submit`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to submit test' }, { status: 500 })
  }
}
