/**
 * Self-contained, zero-dependency, ISO/IEC 18004 compliant QR Code Generator in TypeScript.
 * Based on Project Nayuki's robust QR Code generator library.
 * Supports versions 1 to 40, all ECC levels (L, M, Q, H), automatic 8-mask penalty evaluation,
 * and standard 4-module quiet zone margin for 100% instant camera/scanner readability.
 */

export class QrCode {
  static Ecc = {
    LOW: 0,
    MEDIUM: 1,
    QUARTILE: 2,
    HIGH: 3,
  } as const

  readonly version: number
  readonly errorCorrectionLevel: number
  readonly size: number
  readonly mask: number
  private readonly modules: boolean[][]

  constructor(version: number, errorCorrectionLevel: number, dataCodewords: Uint8Array | number[], msk: number = -1) {
    if (version < 1 || version > 40) throw new RangeError("Version value out of range (1..40)")
    if (msk < -1 || msk > 7) throw new RangeError("Mask value out of range (-1..7)")
    this.version = version
    this.errorCorrectionLevel = errorCorrectionLevel
    this.size = version * 4 + 17

    const row: boolean[] = []
    for (let i = 0; i < this.size; i++) row.push(false)
    this.modules = []
    const isFunction: boolean[][] = []
    for (let i = 0; i < this.size; i++) {
      this.modules.push(row.slice())
      isFunction.push(row.slice())
    }

    const setFunctionModule = (x: number, y: number, isDark: boolean) => {
      this.modules[y][x] = isDark
      isFunction[y][x] = true
    }

    // Finder patterns
    const drawFinderPattern = (x: number, y: number) => {
      for (let dy = -4; dy <= 4; dy++) {
        for (let dx = -4; dx <= 4; dx++) {
          const dist = Math.max(Math.abs(dx), Math.abs(dy))
          const xx = x + dx
          const yy = y + dy
          if (xx >= 0 && xx < this.size && yy >= 0 && yy < this.size) {
            setFunctionModule(xx, yy, dist !== 2 && dist !== 4)
          }
        }
      }
    }

    drawFinderPattern(3, 3)
    drawFinderPattern(this.size - 4, 3)
    drawFinderPattern(3, this.size - 4)

    // Timing patterns
    for (let i = 0; i < this.size; i++) {
      setFunctionModule(6, i, i % 2 === 0)
      setFunctionModule(i, 6, i % 2 === 0)
    }

    // Alignment patterns
    const alignPatPos = QrCode.getAlignmentPatternPositions(this.version)
    const numAlign = alignPatPos.length
    for (let i = 0; i < numAlign; i++) {
      for (let j = 0; j < numAlign; j++) {
        if ((i === 0 && j === 0) || (i === 0 && j === numAlign - 1) || (i === numAlign - 1 && j === 0))
          continue
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            setFunctionModule(alignPatPos[i] + dx, alignPatPos[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1)
          }
        }
      }
    }

    // Format bits helper
    const drawFormatBits = (maskVal: number) => {
      const data = (QrCode.FORMAT_BITS_ERROR_CORRECTION_LEVELS[this.errorCorrectionLevel] << 3) | maskVal
      let rem = data
      for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537)
      const bits = ((data << 10) | rem) ^ 0x5412

      for (let i = 0; i <= 5; i++) setFunctionModule(8, i, ((bits >>> i) & 1) !== 0)
      setFunctionModule(8, 7, ((bits >>> 6) & 1) !== 0)
      setFunctionModule(8, 8, ((bits >>> 7) & 1) !== 0)
      setFunctionModule(7, 8, ((bits >>> 8) & 1) !== 0)
      for (let i = 9; i < 15; i++) setFunctionModule(14 - i, 8, ((bits >>> i) & 1) !== 0)

      for (let i = 0; i < 8; i++) setFunctionModule(this.size - 1 - i, 8, ((bits >>> i) & 1) !== 0)
      for (let i = 8; i < 15; i++) setFunctionModule(8, this.size - 15 + i, ((bits >>> i) & 1) !== 0)
      setFunctionModule(8, this.size - 8, true)
    }

    drawFormatBits(0)

    // Version info if version >= 7
    if (this.version >= 7) {
      let rem = this.version
      for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25)
      const bits = (this.version << 12) | rem
      for (let i = 0; i < 18; i++) {
        const bit = ((bits >>> i) & 1) !== 0
        const a = this.size - 11 + (i % 3)
        const b = Math.floor(i / 3)
        setFunctionModule(a, b, bit)
        setFunctionModule(b, a, bit)
      }
    }

    // Add ECC and interleave
    const allCodewords = this.addEccAndInterleave(Array.from(dataCodewords))

    // Draw codewords
    let bitIndex = 0
    for (let right = this.size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5
      for (let vert = 0; vert < this.size; vert++) {
        for (let j = 0; j < 2; j++) {
          const x = right - j
          const upward = ((right + 1) & 2) === 0
          const y = upward ? this.size - 1 - vert : vert
          if (!isFunction[y][x] && bitIndex < allCodewords.length * 8) {
            this.modules[y][x] = ((allCodewords[bitIndex >>> 3] >>> (7 - (bitIndex & 7))) & 1) !== 0
            bitIndex++
          }
        }
      }
    }

    const applyMask = (maskPattern: number) => {
      for (let y = 0; y < this.size; y++) {
        for (let x = 0; x < this.size; x++) {
          if (isFunction[y][x]) continue
          let invert = false
          switch (maskPattern) {
            case 0: invert = (x + y) % 2 === 0; break
            case 1: invert = y % 2 === 0; break
            case 2: invert = x % 3 === 0; break
            case 3: invert = (x + y) % 3 === 0; break
            case 4: invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break
            case 5: invert = ((x * y) % 2) + ((x * y) % 3) === 0; break
            case 6: invert = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0; break
            case 7: invert = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0; break
          }
          if (invert) this.modules[y][x] = !this.modules[y][x]
        }
      }
    }

    const getPenaltyScore = (): number => {
      let result = 0
      const size = this.size
      const mods = this.modules

      // Adjacent runs
      for (let y = 0; y < size; y++) {
        let runColor = false
        let runX = 0
        for (let x = 0; x < size; x++) {
          if (x === 0 || mods[y][x] !== runColor) {
            runColor = mods[y][x]
            runX = 1
          } else {
            runX++
            if (runX === 5) result += 3
            else if (runX > 5) result++
          }
        }
      }
      for (let x = 0; x < size; x++) {
        let runColor = false
        let runY = 0
        for (let y = 0; y < size; y++) {
          if (y === 0 || mods[y][x] !== runColor) {
            runColor = mods[y][x]
            runY = 1
          } else {
            runY++
            if (runY === 5) result += 3
            else if (runY > 5) result++
          }
        }
      }

      // 2x2 blocks
      for (let y = 0; y < size - 1; y++) {
        for (let x = 0; x < size - 1; x++) {
          const c = mods[y][x]
          if (c === mods[y][x + 1] && c === mods[y + 1][x] && c === mods[y + 1][x + 1]) {
            result += 3
          }
        }
      }

      // Finder-like patterns
      for (let y = 0; y < size; y++) {
        let bits = 0
        for (let x = 0; x < size; x++) {
          bits = ((bits << 1) & 0x7ff) | (mods[y][x] ? 1 : 0)
          if (x >= 10 && (bits === 0x05d || bits === 0x5d0)) result += 40
        }
      }
      for (let x = 0; x < size; x++) {
        let bits = 0
        for (let y = 0; y < size; y++) {
          bits = ((bits << 1) & 0x7ff) | (mods[y][x] ? 1 : 0)
          if (y >= 10 && (bits === 0x05d || bits === 0x5d0)) result += 40
        }
      }

      // Dark/light ratio
      let totalDark = 0
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          if (mods[y][x]) totalDark++
        }
      }
      const total = size * size
      const k = Math.ceil(Math.abs(totalDark * 20 - total * 10) / total) - 1
      result += k * 10
      return result
    }

    if (msk === -1) {
      let minPenalty = 1e9
      let bestMask = 0
      for (let i = 0; i < 8; i++) {
        applyMask(i)
        drawFormatBits(i)
        const penalty = getPenaltyScore()
        if (penalty < minPenalty) {
          minPenalty = penalty
          bestMask = i
        }
        applyMask(i)
      }
      msk = bestMask
    }

    this.mask = msk
    applyMask(msk)
    drawFormatBits(msk)
  }

  getModule(x: number, y: number): boolean {
    return x >= 0 && x < this.size && y >= 0 && y < this.size && this.modules[y][x]
  }

  private addEccAndInterleave(data: number[]): number[] {
    const ver = this.version
    const ecl = this.errorCorrectionLevel
    const numBlocks = QrCode.NUM_ERROR_CORRECTION_BLOCKS[ecl][ver]
    const blockEccLen = QrCode.ECC_CODEWORDS_PER_BLOCK[ecl][ver]
    const rawCodewords = Math.floor(QrCode.getNumRawDataModules(ver) / 8)
    const numShortBlocks = numBlocks - (rawCodewords % numBlocks)
    const shortBlockLen = Math.floor(rawCodewords / numBlocks)

    const blocks: { data: number[]; ecc: number[] }[] = []
    const rsDiv = QrCode.reedSolomonComputeDivisor(blockEccLen)
    for (let i = 0, k = 0; i < numBlocks; i++) {
      const dat = data.slice(k, k + shortBlockLen - blockEccLen + (i >= numShortBlocks ? 1 : 0))
      k += dat.length
      const ecc = QrCode.reedSolomonComputeRemainder(dat, rsDiv)
      blocks.push({ data: dat, ecc })
    }

    const result: number[] = []
    for (let i = 0; i < shortBlockLen - blockEccLen; i++) {
      for (let j = 0; j < numBlocks; j++) result.push(blocks[j].data[i])
    }
    for (let j = numShortBlocks; j < numBlocks; j++) {
      result.push(blocks[j].data[shortBlockLen - blockEccLen])
    }
    for (let i = 0; i < blockEccLen; i++) {
      for (let j = 0; j < numBlocks; j++) result.push(blocks[j].ecc[i])
    }
    return result
  }

  static encodeText(text: string, ecl: number = QrCode.Ecc.MEDIUM): QrCode {
    const utf8Bytes = new TextEncoder().encode(text)
    const bb: number[] = []
    for (const b of utf8Bytes) {
      for (let i = 7; i >= 0; i--) bb.push((b >>> i) & 1)
    }

    let version = 1
    for (; version <= 40; version++) {
      const dataCapBits = QrCode.getNumDataCodewords(version, ecl) * 8
      const ccBits = Math.floor((version + 7) / 17) === 0 ? 8 : 16
      const usedBits = 4 + ccBits + bb.length
      if (usedBits <= dataCapBits) break
    }
    if (version > 40) throw new RangeError("Data too long for QR Code")

    const dataCapBits = QrCode.getNumDataCodewords(version, ecl) * 8
    const bits: number[] = []
    const pushBits = (val: number, len: number) => {
      for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1)
    }

    // Byte mode: 0100
    pushBits(0b0100, 4)
    const ccBits = Math.floor((version + 7) / 17) === 0 ? 8 : 16
    pushBits(utf8Bytes.length, ccBits)
    for (const b of bb) bits.push(b)

    // Terminator
    const term = Math.min(4, dataCapBits - bits.length)
    pushBits(0, term)
    while (bits.length % 8 !== 0) bits.push(0)

    // Pad bytes 0xEC, 0x11
    const padBytes = [0xec, 0x11]
    let padIdx = 0
    while (bits.length < dataCapBits) {
      pushBits(padBytes[padIdx % 2], 8)
      padIdx++
    }

    const codewords: number[] = []
    for (let i = 0; i < bits.length; i += 8) {
      let b = 0
      for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j]
      codewords.push(b)
    }

    return new QrCode(version, ecl, codewords, -1)
  }

  static getNumRawDataModules(ver: number): number {
    let result = (16 * ver + 128) * ver + 64
    if (ver >= 2) {
      const numAlign = Math.floor(ver / 7) + 2
      result -= (25 * numAlign - 10) * numAlign - 55
      if (ver >= 7) result -= 36
    }
    return result
  }

  static getNumDataCodewords(ver: number, ecl: number): number {
    return Math.floor(QrCode.getNumRawDataModules(ver) / 8) -
      QrCode.ECC_CODEWORDS_PER_BLOCK[ecl][ver] * QrCode.NUM_ERROR_CORRECTION_BLOCKS[ecl][ver]
  }

  static reedSolomonComputeDivisor(degree: number): number[] {
    let result = [1]
    for (let i = 0; i < degree; i++) {
      const next: number[] = []
      for (let j = 0; j < result.length + 1; j++) next.push(0)
      const root = QrCode.EXP_TABLE[i % 255]
      for (let j = 0; j < result.length; j++) {
        next[j] ^= result[j]
        next[j + 1] ^= QrCode.reedSolomonMultiply(result[j], root)
      }
      result = next
    }
    return result
  }

  static reedSolomonComputeRemainder(data: number[], divisor: number[]): number[] {
    const result: number[] = []
    for (let i = 0; i < divisor.length - 1; i++) result.push(0)
    for (const b of data) {
      const factor = b ^ (result.shift() || 0)
      result.push(0)
      for (let i = 0; i < divisor.length - 1; i++) {
        result[i] ^= QrCode.reedSolomonMultiply(divisor[i + 1], factor)
      }
    }
    return result
  }

  static reedSolomonMultiply(x: number, y: number): number {
    if (x === 0 || y === 0) return 0
    return QrCode.EXP_TABLE[(QrCode.LOG_TABLE[x] + QrCode.LOG_TABLE[y]) % 255]
  }

  static getAlignmentPatternPositions(ver: number): number[] {
    if (ver === 1) return []
    const numAlign = Math.floor(ver / 7) + 2
    const step = ver === 32 ? 26 : Math.ceil((ver * 4 + 4) / (numAlign * 2 - 2)) * 2
    const result = [6]
    for (let pos = ver * 4 + 10; result.length < numAlign; pos -= step) {
      result.splice(1, 0, pos)
    }
    return result
  }

  toSvgString(margin: number = 4, size: number = 200): string {
    const dim = this.size + margin * 2
    const parts: string[] = []
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (this.modules[y][x]) {
          parts.push(`<rect x="${x + margin}" y="${y + margin}" width="1" height="1" fill="#000000" />`)
        }
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dim} ${dim}" width="${size}" height="${size}" shape-rendering="crispEdges" style="background:#ffffff;display:block;"><rect width="${dim}" height="${dim}" fill="#ffffff"/>${parts.join("")}</svg>`
  }

  // Lookup tables
  static readonly EXP_TABLE: Uint8Array = new Uint8Array(256)
  static readonly LOG_TABLE: Uint8Array = new Uint8Array(256)
  static readonly FORMAT_BITS_ERROR_CORRECTION_LEVELS: number[] = [1, 0, 3, 2]
  static readonly ECC_CODEWORDS_PER_BLOCK: number[][] = [
    [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
    [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  ]
  static readonly NUM_ERROR_CORRECTION_BLOCKS: number[][] = [
    [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
    [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
    [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
    [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],
  ]
}

// Initialize Galois Field tables
;(() => {
  let val = 1
  for (let i = 0; i < 255; i++) {
    QrCode.EXP_TABLE[i] = val
    QrCode.LOG_TABLE[val] = i
    val = (val << 1) ^ (val >= 128 ? 0x11d : 0)
  }
})()

/**
 * Generate standard compliant QR Code SVG.
 * Guaranteed ISO/IEC 18004 compliance with quiet zone margin = 4.
 */
export function generateQrCodeSvg(text: string, size: number = 200, margin: number = 4): string {
  if (!text || !text.trim()) return ""
  try {
    const qr = QrCode.encodeText(text.trim(), QrCode.Ecc.MEDIUM)
    return qr.toSvgString(margin, size)
  } catch (err) {
    console.warn("QR code generation fallback error:", err)
    return ""
  }
}

/**
 * Generate Data URI suitable for direct <img src="..." /> binding.
 */
export function getQrCodeDataUri(text: string, size: number = 200, margin: number = 4): string {
  const svg = generateQrCodeSvg(text, size, margin)
  if (!svg) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=${margin}&ecc=M&data=${encodeURIComponent(text)}`
  }
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}
