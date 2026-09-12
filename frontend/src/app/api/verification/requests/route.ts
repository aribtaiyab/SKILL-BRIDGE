import { NextRequest } from 'next/server'
import { POST as handlePost } from '../request/route'
import { GET as handleGet } from '../list/route'

export async function POST(req: NextRequest) {
  return handlePost(req)
}

export async function GET(req: NextRequest) {
  return handleGet(req)
}
