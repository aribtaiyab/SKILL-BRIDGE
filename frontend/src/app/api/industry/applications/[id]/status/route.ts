import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/server'
import { updateApplicationStatus } from '@/lib/database/applications-store'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, note } = body

    if (!status) {
      return NextResponse.json({
        success: false,
        error: { message: 'Status is required' },
      }, { status: 400 })
    }

    const timestamp = new Date().toISOString()

    try {
      const admin = createSupabaseAdminClient()
      
      const { error: updateErr } = await (admin as any)
        .from('applications')
        .update({
          status: status.toLowerCase(),
          updated_at: timestamp,
        })
        .eq('id', id)

      if (!updateErr) {
        await (admin as any).from('application_status_history').insert({
          application_id: id,
          status: status.toLowerCase(),
          note: note || `Status updated to ${status}`,
          changed_at: timestamp,
        })
      }
    } catch (dbErr: any) {
      console.warn('[Industry Application Status API] Supabase update fallback:', dbErr.message)
    }

    // Keep shared memory store in sync
    updateApplicationStatus(id, status.toLowerCase())

    return NextResponse.json({
      success: true,
      data: {
        id,
        status: status.toLowerCase(),
        updated_at: timestamp,
        message: 'Status updated successfully',
      },
    })
  } catch (err: any) {
    console.error('[Industry Application Status API Error]:', err)
    return NextResponse.json({
      success: false,
      error: { message: err?.message || 'Failed to update application status' },
    }, { status: 500 })
  }
}
