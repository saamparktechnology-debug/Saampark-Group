/**
 * Self-contained, zero-dependency, pure TypeScript QR Code SVG generator.
 * Encodes text/URLs (Byte mode, ECC Level M/L) directly into clean inline SVG.
 * 100% offline, zero network latency, renders synchronously before print.
 */

// QR Code Constants & Tables
const GF256_EXP = new Uint8Array(512)
const GF256_LOG = new Uint8Array(256)

;(() => {
  let val = 1
  for (let i = 0; i < 255; i++) {
    GF256_EXP[i] = val
    GF256_LOG[val] = i
    val = (val << 1) ^ (val >= 128 ? 0x11d : 0)
  }
  for (let i = 255; i < 512; i++) {
    GF256_EXP[i] = GF256_EXP[i - 255]
  }
})()

function gfMul(x: number, y: number): number {
  if (x === 0 || y === 0) return 0
  return GF256_EXP[GF256_LOG[x] + GF256_LOG[y]]
}

function rsComputePoly(ecCount: number): Uint8Array {
  const poly = new Uint8Array(ecCount + 1)
  poly[0] = 1
  let root = 1
  for (let i = 0; i < ecCount; i++) {
    for (let j = i + 1; j > 0; j--) {
      poly[j] = poly[j] ^ gfMul(poly[j - 1], root)
    }
    root = (root << 1) ^ (root >= 128 ? 0x11d : 0)
  }
  return poly
}

function rsRemainder(data: Uint8Array, ecCount: number, generator: Uint8Array): Uint8Array {
  const rem = new Uint8Array(ecCount)
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ rem[0]
    for (let j = 0; j < ecCount - 1; j++) {
      rem[j] = rem[j + 1] ^ gfMul(factor, generator[j + 1])
    }
    rem[ecCount - 1] = gfMul(factor, generator[ecCount])
  }
  return rem
}

// Version table: [dataCapacityBytes, ecBytes, totalCodewords, blocksGroup1, dataPerBlock1, blocksGroup2, dataPerBlock2]
// For ECC Level M
const VERSION_SPECS_M: { [v: number]: { dataCap: number; ecBytes: number; ecPerBlock: number; b1: number; d1: number; b2: number; d2: number; align: number[] } } = {
  1: { dataCap: 14, ecBytes: 10, ecPerBlock: 10, b1: 1, d1: 16, b2: 0, d2: 0, align: [] },
  2: { dataCap: 26, ecBytes: 16, ecPerBlock: 16, b1: 1, d1: 28, b2: 0, d2: 0, align: [6, 18] },
  3: { dataCap: 42, ecBytes: 26, ecPerBlock: 26, b1: 1, d1: 44, b2: 0, d2: 0, align: [6, 22] },
  4: { dataCap: 62, ecBytes: 36, ecPerBlock: 18, b1: 2, d1: 32, b2: 0, d2: 0, align: [6, 26] },
  5: { dataCap: 84, ecBytes: 48, ecPerBlock: 24, b1: 2, d1: 43, b2: 0, d2: 0, align: [6, 30] },
  6: { dataCap: 106, ecBytes: 64, ecPerBlock: 16, b1: 4, d1: 27, b2: 0, d2: 0, align: [6, 34] },
  7: { dataCap: 122, ecBytes: 72, ecPerBlock: 18, b1: 4, d1: 31, b2: 0, d2: 0, align: [6, 22, 38] },
  8: { dataCap: 152, ecBytes: 88, ecPerBlock: 22, b1: 2, d1: 38, b2: 2, d2: 39, align: [6, 24, 42] },
  9: { dataCap: 180, ecBytes: 110, ecPerBlock: 22, b1: 3, d1: 36, b2: 2, d2: 37, align: [6, 26, 46] },
  10: { dataCap: 213, ecBytes: 130, ecPerBlock: 26, b1: 4, d1: 43, b2: 1, d2: 44, align: [6, 28, 50] },
}

export function generateQrCodeSvg(text: string, size: number = 160): string {
  if (!text) return ""

  const utf8Bytes = new TextEncoder().encode(text)
  const len = utf8Bytes.length

  // Find minimum version that fits data
  let version = 1
  while (version <= 10 && (VERSION_SPECS_M[version]?.dataCap || 0) < len + 2) {
    version++
  }
  if (version > 10) version = 10

  const spec = VERSION_SPECS_M[version]
  const moduleCount = 17 + version * 4

  // Prepare data stream (Byte mode = 0100)
  const totalBits = spec.dataCap * 8
  const bitBuf: number[] = []

  const pushBits = (val: number, count: number) => {
    for (let i = count - 1; i >= 0; i--) {
      bitBuf.push((val >> i) & 1)
    }
  }

  // Mode indicator: 8-bit byte mode (0100)
  pushBits(0b0100, 4)
  // Character count indicator (8 bits for v1-9, 16 bits for v10+)
  pushBits(len, version < 10 ? 8 : 16)
  // Data bytes
  for (let i = 0; i < len; i++) {
    pushBits(utf8Bytes[i], 8)
  }
  // Terminator (up to 4 zeroes)
  const padZeros = Math.min(4, totalBits - bitBuf.length)
  pushBits(0, padZeros)
  // Pad to multiple of 8 bits
  while (bitBuf.length % 8 !== 0) {
    bitBuf.push(0)
  }
  // Pad bytes 0xEC, 0x11
  const padBytes = [0xec, 0x11]
  let padIdx = 0
  while (bitBuf.length < totalBits) {
    pushBits(padBytes[padIdx % 2], 8)
    padIdx++
  }

  // Convert bits to byte codewords
  const dataCodewords = new Uint8Array(spec.dataCap)
  for (let i = 0; i < spec.dataCap; i++) {
    let byteVal = 0
    for (let b = 0; b < 8; b++) {
      byteVal = (byteVal << 1) | bitBuf[i * 8 + b]
    }
    dataCodewords[i] = byteVal
  }

  // Error correction blocks
  const generator = rsComputePoly(spec.ecPerBlock)
  const totalBlocks = spec.b1 + spec.b2
  const dataBlocks: Uint8Array[] = []
  const ecBlocks: Uint8Array[] = []

  let dataOffset = 0
  for (let i = 0; i < spec.b1; i++) {
    const blk = dataCodewords.slice(dataOffset, dataOffset + spec.d1)
    dataBlocks.push(blk)
    ecBlocks.push(rsRemainder(blk, spec.ecPerBlock, generator))
    dataOffset += spec.d1
  }
  for (let i = 0; i < spec.b2; i++) {
    const blk = dataCodewords.slice(dataOffset, dataOffset + spec.d2)
    dataBlocks.push(blk)
    ecBlocks.push(rsRemainder(blk, spec.ecPerBlock, generator))
    dataOffset += spec.d2
  }

  // Interleave data codewords
  const interleavedData: number[] = []
  const maxDataLen = Math.max(spec.d1, spec.d2)
  for (let i = 0; i < maxDataLen; i++) {
    for (let b = 0; b < totalBlocks; b++) {
      if (i < dataBlocks[b].length) {
        interleavedData.push(dataBlocks[b][i])
      }
    }
  }

  // Interleave EC codewords
  for (let i = 0; i < spec.ecPerBlock; i++) {
    for (let b = 0; b < totalBlocks; b++) {
      if (i < ecBlocks[b].length) {
        interleavedData.push(ecBlocks[b][i])
      }
    }
  }

  // Matrix creation
  const matrix: (number | null)[][] = Array.from({ length: moduleCount }, () => Array(moduleCount).fill(null))
  const isFunction: boolean[][] = Array.from({ length: moduleCount }, () => Array(moduleCount).fill(false))

  // Finder pattern helper
  const addFinderPattern = (row: number, col: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = row + r
        const nc = col + c
        if (nr >= 0 && nr < moduleCount && nc >= 0 && nc < moduleCount) {
          const isBlack = (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
                          (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
                          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
          matrix[nr][nc] = isBlack ? 1 : 0
          isFunction[nr][nc] = true
        }
      }
    }
  }

  addFinderPattern(0, 0)
  addFinderPattern(0, moduleCount - 7)
  addFinderPattern(moduleCount - 7, 0)

  // Alignment patterns
  if (spec.align.length > 0) {
    const coords = spec.align
    for (const r of coords) {
      for (const c of coords) {
        // Skip if overlaps finder
        if ((r <= 8 && c <= 8) || (r <= 8 && c >= moduleCount - 8) || (r >= moduleCount - 8 && c <= 8)) {
          continue
        }
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const isBlack = Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0)
            matrix[r + dr][c + dc] = isBlack ? 1 : 0
            isFunction[r + dr][c + dc] = true
          }
        }
      }
    }
  }

  // Timing patterns
  for (let i = 8; i < moduleCount - 8; i++) {
    const val = i % 2 === 0 ? 1 : 0
    if (!isFunction[6][i]) {
      matrix[6][i] = val
      isFunction[6][i] = true
    }
    if (!isFunction[i][6]) {
      matrix[i][6] = val
      isFunction[i][6] = true
    }
  }

  // Dark module
  matrix[moduleCount - 8][8] = 1
  isFunction[moduleCount - 8][8] = true

  // Format info area reserve
  for (let i = 0; i <= 8; i++) {
    if (!isFunction[8][i]) isFunction[8][i] = true
    if (!isFunction[i][8]) isFunction[i][8] = true
  }
  for (let i = moduleCount - 8; i < moduleCount; i++) {
    if (!isFunction[8][i]) isFunction[8][i] = true
    if (!isFunction[i][8]) isFunction[i][8] = true
  }

  // Place data bits in zigzag
  const allBits: number[] = []
  for (const b of interleavedData) {
    for (let i = 7; i >= 0; i--) {
      allBits.push((b >> i) & 1)
    }
  }

  let bitIdx = 0
  let upward = true
  for (let right = moduleCount - 1; right > 0; right -= 2) {
    if (right === 6) right--
    const rows = upward
      ? Array.from({ length: moduleCount }, (_, i) => moduleCount - 1 - i)
      : Array.from({ length: moduleCount }, (_, i) => i)

    for (const r of rows) {
      for (const c of [right, right - 1]) {
        if (!isFunction[r][c]) {
          matrix[r][c] = bitIdx < allBits.length ? allBits[bitIdx++] : 0
        }
      }
    }
    upward = !upward
  }

  // Apply Mask 0: (row + col) % 2 === 0
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (!isFunction[r][c]) {
        if ((r + c) % 2 === 0) {
          matrix[r][c] = (matrix[r][c] || 0) ^ 1
        }
      }
    }
  }

  // Format information for Level M, Mask 0: 0b100000011001110
  const formatBits = [1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 0]
  // Top-left
  const topPositions = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
  ]
  for (let i = 0; i < 15; i++) {
    matrix[topPositions[i][0]][topPositions[i][1]] = formatBits[i]
  }
  // Bottom-left and top-right
  for (let i = 0; i < 7; i++) {
    matrix[moduleCount - 1 - i][8] = formatBits[i]
  }
  for (let i = 0; i < 8; i++) {
    matrix[8][moduleCount - 8 + i] = formatBits[7 + i]
  }

  // Generate SVG with 1 module quiet zone margin
  const quiet = 1
  const viewBoxSize = moduleCount + quiet * 2
  const rects: string[] = []

  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (matrix[r][c] === 1) {
        rects.push(`<rect x="${c + quiet}" y="${r + quiet}" width="1" height="1" fill="#09090b" />`)
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxSize} ${viewBoxSize}" width="${size}" height="${size}" shape-rendering="crispEdges" style="background:#ffffff;display:block;">${rects.join("")}</svg>`
}

export function getQrCodeDataUri(text: string, size: number = 160): string {
  const svg = generateQrCodeSvg(text, size)
  if (!svg) return ""
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

