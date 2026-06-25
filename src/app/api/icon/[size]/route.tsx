import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size: sizeStr } = await params
  const size = Math.min(Math.max(parseInt(sizeStr) || 192, 48), 1024)
  const r = Math.round(size * 0.22)

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(140deg, #2C4A2E 0%, #1E3320 100%)',
          borderRadius: r,
        }}
      >
        {/* Leaf shape made of two overlapping circles */}
        <div style={{ position: 'relative', width: size * 0.52, height: size * 0.52, display: 'flex' }}>
          {/* Left petal */}
          <div
            style={{
              position: 'absolute',
              width: size * 0.34,
              height: size * 0.34,
              background: '#D4E8D5',
              borderRadius: '50% 50% 50% 0',
              transform: 'rotate(-45deg)',
              top: '16%',
              left: '8%',
            }}
          />
          {/* Right petal */}
          <div
            style={{
              position: 'absolute',
              width: size * 0.34,
              height: size * 0.34,
              background: '#D4E8D5',
              borderRadius: '50% 50% 0 50%',
              transform: 'rotate(45deg)',
              top: '16%',
              right: '8%',
            }}
          />
          {/* Stem */}
          <div
            style={{
              position: 'absolute',
              width: size * 0.055,
              height: size * 0.28,
              background: '#A8C9AA',
              borderRadius: size * 0.03,
              bottom: '2%',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          />
        </div>
      </div>
    ),
    { width: size, height: size }
  )
}
