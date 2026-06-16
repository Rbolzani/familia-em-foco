import { NextResponse } from 'next/server'

export async function GET() {
  return new NextResponse('loaderio-811e668ca8d34a2b6b7b6a9b6f7500b1', {
    headers: { 'Content-Type': 'text/plain' },
  })
}
