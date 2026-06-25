import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size: sizeStr } = await params
  const size = Math.min(Math.max(parseInt(sizeStr) || 192, 48), 1024)
  const fontSize = Math.round(size * 0.38)

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#2C4A2E',
          borderRadius: Math.round(size * 0.22),
        }}
      >
        <span
          style={{
            color: '#D4E8D5',
            fontSize,
            fontWeight: 700,
            letterSpacing: -2,
            lineHeight: 1,
          }}
        >
          FF
        </span>
      </div>
    ),
    { width: size, height: size }
  )
}
