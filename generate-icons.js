// Gera icon-192.png e icon-512.png com o logo coral da landing page:
// fundo coral #FF6B5C + anel branco + ponto branco (igual ao icon.svg)
// Executar: node generate-icons.js
const zlib = require('zlib')
const fs   = require('fs')
const path = require('path')

function uint32BE(n) {
  const b = Buffer.alloc(4)
  b.writeUInt32BE(n, 0)
  return b
}

function crc32(buf) {
  let crc = 0xFFFFFFFF
  const table = []
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
    table[i] = c
  }
  for (const byte of buf) crc = table[(crc ^ byte) & 0xFF] ^ (crc >>> 8)
  return (crc ^ 0xFFFFFFFF) >>> 0
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii')
  const len       = uint32BE(data.length)
  const crcInput  = Buffer.concat([typeBytes, data])
  const crcBytes  = uint32BE(crc32(crcInput))
  return Buffer.concat([len, typeBytes, data, crcBytes])
}

function makePNG(size) {
  const S = size / 512

  const coral = [0xFF, 0x6B, 0x5C] // #FF6B5C
  const white = [0xFF, 0xFF, 0xFF]

  // Arredondamento: rx=157 na grade 512px
  const rx = Math.round(157 * S)

  // Anel: centro 256,256 — r=92, stroke=43 (na grade 512)
  const cx = 256 * S, cy = 256 * S
  const ringInner = (92 - 43 / 2) * S  // 70.5
  const ringOuter = (92 + 43 / 2) * S  // 113.5

  // Ponto: centro 270,270 — r=43 (na grade 512)
  const dotCx = 270 * S, dotCy = 270 * S
  const dotR  = 43 * S

  const sig  = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  // Color type 6 = RGBA
  const ihdr = chunk('IHDR', Buffer.concat([
    uint32BE(size), uint32BE(size),
    Buffer.from([8, 6, 0, 0, 0])
  ]))

  const rows = []
  for (let y = 0; y < size; y++) {
    const row = [0] // filter byte
    for (let x = 0; x < size; x++) {
      // Dentro do quadrado arredondado?
      const dx = Math.min(x, size - 1 - x)
      const dy = Math.min(y, size - 1 - y)
      const inCorner = dx < rx && dy < rx
      const inRound  = !inCorner || (dx - rx) ** 2 + (dy - rx) ** 2 <= rx * rx

      if (!inRound) { row.push(0, 0, 0, 0); continue } // transparente

      // Ponto branco?
      const dxd = x - dotCx, dyd = y - dotCy
      if (dxd * dxd + dyd * dyd <= dotR * dotR) {
        row.push(...white, 255); continue
      }

      // Anel branco (annulus)?
      const dxr = x - cx, dyr = y - cy
      const dist = Math.sqrt(dxr * dxr + dyr * dyr)
      if (dist >= ringInner && dist <= ringOuter) {
        row.push(...white, 255); continue
      }

      // Fundo coral
      row.push(...coral, 255)
    }
    rows.push(Buffer.from(row))
  }

  const raw        = Buffer.concat(rows)
  const compressed = zlib.deflateSync(raw, { level: 9 })
  const idat       = chunk('IDAT', compressed)
  const iend       = chunk('IEND', Buffer.alloc(0))

  return Buffer.concat([sig, ihdr, idat, iend])
}

const out = path.join(__dirname, 'public')
fs.writeFileSync(path.join(out, 'icon-192.png'), makePNG(192))
fs.writeFileSync(path.join(out, 'icon-512.png'), makePNG(512))
console.log('✓ icon-192.png e icon-512.png gerados com logo coral')
