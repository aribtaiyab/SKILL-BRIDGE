import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  return NextResponse.json({ success: true, message: `Opportunity ${id} saved.`, isSaved: true })
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  return NextResponse.json({ success: true, message: `Opportunity ${id} unsaved.`, isSaved: false })
}
