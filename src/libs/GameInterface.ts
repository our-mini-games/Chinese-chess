import { createCanvas } from './Canvas'
import { Camp, colorMapper } from '../definitions'
import Point from './Point'
import ChessPiece from './ChessPiece'
import { ActivePieceAnimation, AnimationReturnType, createAnimation, registerActivePieceAnimation } from './Animation'
import { VoidFunction } from '../types'
import { ClientEvents } from '../types/emitter'
import mitt, { Emitter } from 'mitt'

export interface SizeOptions {
  width: number
  height: number
  innerWidth: number
  innerHeight: number
  padding: number
  baseSize: number
  rotate: number
  fixedOrigin: (rotate: number, ctx?: CanvasRenderingContext2D) => void
}

export interface GameInterface {
  mainCanvas: HTMLCanvasElement
  checkerBoardCanvas: HTMLCanvasElement
  readonly sizeOptions: SizeOptions
  readonly animations: AnimationReturnType
  on: Emitter<ClientEvents>['on']
  mount: (node: Element) => void
  destroy: (node: Element) => void
  getPointer: (e: MouseEvent) => Point

  clearMain: () => void
  clearAll: () => void
  setRotate: (angle: number) => void
  setResource: (resource: any) => void

  activePieceAnimation: ActivePieceAnimation

  drawChessPieces: (chessPieces: ChessPiece[]) => void
  drawLastStop: (point: Point, camp: Camp) => void
  drawMovePath: (points: Point[]) => void
  drawAllowPoints: (points: Point[]) => void
  drawCurrentStop: (point: Point, camp: Camp) => void
}

type AnchorType = 'left' | 'middle' | 'right'

const clearShadow = (ctx: CanvasRenderingContext2D) => {
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0
  ctx.shadowColor = 'transparent'
}

const drawEngrave = (ctx: CanvasRenderingContext2D, cb: VoidFunction, size: number, isLine?: boolean): void => {
  ctx.beginPath()
  ctx.shadowBlur = size
  ctx.shadowColor = colorMapper.white
  ctx.shadowOffsetX = isLine ? size / 2 : size
  ctx.shadowOffsetY = isLine ? size / 2 : size
  cb()

  ctx.beginPath()
  ctx.shadowBlur = size
  ctx.shadowColor = colorMapper.shadow
  ctx.shadowOffsetX = -(isLine ? size / 2 : size)
  ctx.shadowOffsetY = -(isLine ? size / 2 : size)
  cb()
}

const drawCheckerboard = (ctx: CanvasRenderingContext2D, {
  width,
  height,
  innerWidth,
  innerHeight,
  baseSize,
  rotate
}: SizeOptions, resource: any = {}): void => {
  ctx.clearRect(0, 0, width, height)

  ctx.save()

  ctx.translate(width / 2, height / 2)
  ctx.rotate(rotate)
  ctx.translate(-width / 2, -height / 2)

  ctx.lineCap = 'round'

  const lineWidth = baseSize / 32

  ctx.save()

  // BG
  ctx.fillStyle = colorMapper.light
  if (resource.pattern) {
    const p = ctx.createPattern(resource.pattern, 'repeat')
    ctx.fillStyle = p!
    ctx.roundRect(0, 0, width, height, baseSize / 4)
    ctx.fill()
  } else {
    ctx.fillStyle = colorMapper.light
    ctx.roundRect(0, 0, width, height, baseSize / 4)
    ctx.fill()
  }

  ctx.translate(width / 2, height / 2)

  ctx.save()
  ;[Camp.RED, Camp.BLACK].forEach((camp, index) => {
    ctx.rotate(Math.PI * index)
    drawPrison()
    drawVerticalLine()
    drawHorizontalLine()
    drawAnchors()
    drawText(camp)
  })
  ctx.restore()

  drawBorder()
  drawOutline()

  ctx.restore()

  function drawBorder (): void {
    ctx.save()
    drawEngrave(ctx, () => {
      ctx.strokeStyle = colorMapper.line
      ctx.lineWidth = lineWidth
      ctx.strokeRect(-innerWidth / 2, -innerHeight / 2, innerWidth, innerHeight)
    }, lineWidth, true)

    ctx.restore()
  }

  function drawOutline (): void {
    ctx.save()
    drawEngrave(ctx, () => {
      ctx.strokeStyle = colorMapper.line
      ctx.lineWidth = lineWidth * 2
      ctx.strokeRect(-innerWidth / 2 - lineWidth * 4, -innerHeight / 2 - lineWidth * 4, innerWidth + lineWidth * 8, innerHeight + lineWidth * 8)
    }, lineWidth * 2, true)

    ctx.restore()
  }

  function drawVerticalLine (): void {
    for (let i = 0; i < 9; i++) {
      drawEngrave(ctx, () => {
        ctx.beginPath()
        ctx.lineWidth = lineWidth
        ctx.strokeStyle = colorMapper.line
        ctx.moveTo(-innerWidth / 2 + baseSize * i, innerHeight / 2)
        ctx.lineTo(-innerWidth / 2 + baseSize * i, [0, 8].includes(i) ? 0 : baseSize / 2)
        ctx.stroke()
      }, lineWidth, true)
    }
  }

  function drawHorizontalLine (): void {
    for (let i = 0; i < 5; i++) {
      drawEngrave(ctx, () => {
        ctx.beginPath()
        ctx.lineWidth = lineWidth
        ctx.strokeStyle = colorMapper.line
        ctx.moveTo(-innerWidth / 2, innerHeight / 2 - baseSize * i)
        ctx.lineTo(innerWidth / 2, innerHeight / 2 - baseSize * i)
        ctx.stroke()
      }, lineWidth, true)
    }
  }

  function drawPrison (): void {
    drawEngrave(ctx, () => {
      ctx.beginPath()
      ctx.lineWidth = lineWidth
      ctx.strokeStyle = colorMapper.line
      ctx.moveTo(-baseSize, innerHeight / 2)
      ctx.lineTo(baseSize, innerHeight / 2 - baseSize * 2)
      ctx.stroke()

      ctx.beginPath()
      ctx.lineWidth = lineWidth
      ctx.strokeStyle = colorMapper.line
      ctx.moveTo(baseSize, innerHeight / 2)
      ctx.lineTo(-baseSize, innerHeight / 2 - baseSize * 2)
      ctx.stroke()
    }, lineWidth, true)
  }

  function drawAnchors (): void {
    const anchorsCoords = [
      new Point(0, 1.5),
      new Point(-2, 1.5),
      new Point(2, 1.5),
      new Point(-4, 1.5),
      new Point(4, 1.5),
      new Point(-3, 2.5),
      new Point(3, 2.5)
    ]

    anchorsCoords.forEach(({ x, y }) => {
      ctx.save()
      ctx.translate(x * baseSize, y * baseSize)
      drawEngrave(ctx, () => {
        drawAnchor(x === -4 ? 'left' : x === 4 ? 'right' : 'middle')
      }, lineWidth, true)
      ctx.restore()
    })
  }

  function drawAnchor (type: AnchorType = 'middle'): void {
    ctx.save()
    ctx.strokeStyle = colorMapper.line

    const gap = lineWidth * 2
    const length = baseSize / 4

    for (let i = 1; i <= 4; i++) {
      ctx.rotate(-Math.PI * 90 / 180)
      if (
        (type === 'left' && [2, 3].includes(i)) ||
        (type === 'right' && [1, 4].includes(i))
      ) {
        continue
      }

      ctx.beginPath()
      ctx.moveTo(gap, gap)
      ctx.lineTo(gap, length)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(gap, gap)
      ctx.lineTo(length, gap)
      ctx.stroke()
    }
    ctx.restore()
  }

  function drawText (camp = Camp.RED): void {
    const textGroup = camp === Camp.RED
      ? ['一', '二', '三', '四', '五', '六', '七', '八', '九']
      : [1, 2, 3, 4, 5, 6, 7, 8, 9]

    ctx.save()

    textGroup.forEach((text, index) => {
      drawEngrave(ctx, () => {
        ctx.beginPath()
        ctx.font = `Bold ${baseSize / 4}px FZLSFT`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = colorMapper.line
        ctx.fillText(text.toString(), baseSize * (index - 4) * -1, innerHeight / 2 + baseSize / 3)
      }, 2, false)
    })

    drawEngrave(ctx, () => {
      ctx.save()
      ctx.translate(0, baseSize / 24)
      ctx.beginPath()
      ctx.font = `normal ${baseSize / 1.5}px FZLSFT`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = colorMapper.line
      ctx.fillText(camp === Camp.RED ? '汉界' : '楚河', baseSize * 2.5, 0)
      ctx.restore()
    }, 2, false)

    ctx.restore()
  }
}

const drawChessPieces = (ctx: CanvasRenderingContext2D, {
  baseSize,
  rotate,
  fixedOrigin
}: SizeOptions, chessPieces: ChessPiece[]): void => {
  ctx.save()

  fixedOrigin(rotate, ctx)

  chessPieces.forEach(piece => {
    drawChessPiece(ctx, baseSize, piece, rotate)
  })

  ctx.restore()
}

const drawChessPiece = (
  ctx: CanvasRenderingContext2D,
  baseSize: number,
  { name, camp, coord }: ChessPiece,
  rotate: number
): void => {
  ctx.save()

  // 移动到当前棋子坐标中点
  ctx.translate(
    (coord.x - 1) * baseSize,
    (coord.y - 1) * baseSize
  )
  ctx.rotate(-rotate)

  // 绘制棋子
  ctx.beginPath()

  // 外圆
  const displacement = baseSize / 32
  ctx.translate(-displacement, -displacement)
  ctx.shadowColor = colorMapper.shadow
  ctx.shadowBlur = displacement * 4
  ctx.shadowOffsetX = displacement * 2
  ctx.shadowOffsetY = displacement * 2
  ctx.fillStyle = camp === Camp.RED ? colorMapper.redDark : colorMapper.blackDark
  ctx.arc(0, 0, (baseSize - displacement * 4) / 2, 0, 2 * Math.PI)
  ctx.fill()
  clearShadow(ctx)

  // 高光
  ctx.save()
  ctx.beginPath()
  ctx.arc(0, 0, (baseSize - displacement * 8) / 1.9, Math.PI, 1.25 * Math.PI)
  ctx.shadowColor = colorMapper.white
  ctx.shadowBlur = displacement
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0
  // ctx.strokeStyle = colorMapper.white
  ctx.strokeStyle = 'rgba(255,255,255,0.65)'
  ctx.lineCap = 'round'
  ctx.lineWidth = baseSize / 16
  ctx.stroke()
  ctx.restore()

  // 内圆
  ctx.translate(0, -displacement)
  ctx.beginPath()
  ctx.fillStyle = camp === Camp.RED ? colorMapper.redLight : colorMapper.blackLight
  ctx.arc(0, 0, (baseSize - displacement * 8) / 2, 0, 2 * Math.PI)
  ctx.fill()

  // 字
  drawEngrave(ctx, () => {
    ctx.save()
    ctx.translate(0, baseSize / 24)
    ctx.beginPath()
    ctx.font = `normal ${baseSize / 1.6}px FZLSFT`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = colorMapper.white
    ctx.fillText(name, 0, 0)
    ctx.restore()
  }, 2, false)

  // // 圈
  // ctx.beginPath()
  // ctx.lineWidth = displacement / 2
  // ctx.strokeStyle = colorMapper.white
  // ctx.arc(0, 0, (baseSize - displacement * 12) / 2 + displacement, 0, 2 * Math.PI)
  // ctx.stroke()

  ctx.restore()
}

/** 棋子移动后，之前的位置 */
const drawLastStop = (ctx: CanvasRenderingContext2D, { baseSize, rotate, fixedOrigin }: SizeOptions, point: Point, camp: Camp): void => {
  const { x, y } = Point.toActualPoint(new Point(point.x - 1, point.y - 1), baseSize)

  ctx.save()
  fixedOrigin(rotate, ctx)
  ctx.translate(x, y)
  const lineWidth = baseSize / 32

  ;[baseSize / 16, baseSize / 6].forEach((radius, index) => {
    ctx.beginPath()
    ctx.strokeStyle = camp === Camp.RED ? colorMapper.red : colorMapper.black
    ctx.fillStyle = camp === Camp.RED ? colorMapper.red : colorMapper.black
    ctx.lineWidth = lineWidth
    ctx.arc(0, 0, radius, 0, Math.PI * 2)
    if (index === 0) {
      ctx.fill()
    } else {
      ctx.stroke()
    }
  })

  ctx.beginPath()
  ctx.moveTo(-baseSize / 4, 0)
  ctx.lineTo(baseSize / 4, 0)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(0, -baseSize / 4)
  ctx.lineTo(0, baseSize / 4)
  ctx.stroke()

  ctx.restore()
}

/** 棋子移动后的位置高亮提醒 */
const drawCurrentStop = (ctx: CanvasRenderingContext2D, { baseSize, rotate, fixedOrigin }: SizeOptions, point: Point, camp: Camp): void => {
  const { x, y } = Point.toActualPoint(new Point(point.x - 1, point.y - 1), baseSize)

  ctx.save()
  fixedOrigin(rotate, ctx)

  ctx.translate(x, y)

  ctx.beginPath()
  const displacement = baseSize / 32
  ctx.translate(rotate === 0 ? -displacement : displacement, rotate === 0 ? -displacement : displacement)
  ctx.strokeStyle = camp === Camp.RED ? colorMapper.red : colorMapper.black
  ctx.lineWidth = baseSize / 24
  const len = (baseSize - displacement * 4) / 2

  for (let i = 0; i < 4; i++) {
    ctx.save()
    ctx.beginPath()
    ctx.rotate(i * 90 * Math.PI / 180)
    ctx.moveTo(-len, baseSize / 8 - len)
    ctx.lineTo(-len, -len)
    ctx.lineTo(baseSize / 8 - len, -len)
    ctx.stroke()
    ctx.restore()
  }

  // ctx.beginPath()
  // ctx.strokeStyle = colorMapper.red
  // ctx.lineWidth = ctx.lineWidth / 4
  // ctx.strokeRect(-len, -len, len * 2, len * 2)

  ctx.restore()
}

/** 移动轨迹 */
const drawMovePath = (ctx: CanvasRenderingContext2D, { baseSize, rotate, fixedOrigin }: SizeOptions, points: Point[]): void => {
  if (points.length === 0) {
    return
  }

  let r = baseSize / 32 // 4 => 8 => 12
  const rRate = baseSize / 32
  const arrowHeight = baseSize / 10
  const { length } = points

  points.reduce((prev, curr, index) => {
    const { x: x1, y: y1 } = Point.toActualPoint(new Point(prev.x - 1, prev.y - 1), baseSize)
    const { x: x2, y: y2 } = Point.toActualPoint(new Point(curr.x - 1, curr.y - 1), baseSize)

    const side = Math.sqrt(((x1 - x2) ** 2 + (y1 - y2) ** 2))

    let a = Math.atan(Math.abs(x1 - x2) / Math.abs(y1 - y2))

    a = x1 > x2 ? (Math.PI - a) : (Math.PI + a)
    if (x1 > x2) {
      a = Math.PI - a
      if (y1 < y2) {
        a = Math.PI - a
      }
    } else {
      a = Math.PI + a
      if (y1 < y2) {
        a = Math.PI - a
      }
    }

    ctx.save()
    fixedOrigin(rotate, ctx)
    ctx.translate(x1, y1)
    ctx.rotate(x1 > x2 ? (Math.PI - a) : (Math.PI + a))

    ctx.beginPath()
    ctx.strokeStyle = colorMapper.success
    ctx.fillStyle = colorMapper.success
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.stroke()
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(-r, 0)
    ctx.lineTo(-r - rRate, index === length - 1 ? (side - arrowHeight * 2) : side)

    ctx.lineTo(r + rRate, index === length - 1 ? (side - arrowHeight * 2) : side)
    ctx.lineTo(r, 0)
    ctx.closePath()
    ctx.fill()

    if (index === length - 1) {
      // 结尾箭头
      ctx.beginPath()
      ctx.scale(1.5, 0.99)
      ctx.moveTo(0, side)
      ctx.lineTo(r + rRate, side - arrowHeight * 2)
      ctx.lineTo(-r - rRate, side - arrowHeight * 2)
      ctx.closePath()
      ctx.fill()
    }

    ctx.restore()
    r += rRate
    return curr
  })
}

/** 当前选中棋子允许走的坐标点提示 */
const drawAllowPoints = (ctx: CanvasRenderingContext2D, { baseSize, rotate, fixedOrigin }: SizeOptions, points: Point[]): void => {
  points.forEach(point => {
    const { x, y } = Point.toActualPoint(point, baseSize)

    ctx.save()
    fixedOrigin(rotate, ctx)
    // 需要注意他是从 0，0 开始的，而我们算出来的 Points 是从 1，1 => 9,10
    ctx.translate(x - baseSize, y - baseSize)

    ctx.beginPath()
    ctx.arc(0, 0, baseSize / 8, 0, Math.PI * 2)
    const gradient = ctx.createLinearGradient(-baseSize / 8, baseSize / 8, baseSize / 4, baseSize / 4)
    gradient.addColorStop(0, '#10b20a')
    gradient.addColorStop(1, colorMapper.white)
    ctx.fillStyle = gradient
    ctx.fill()

    // 高光
    ctx.save()
    ctx.beginPath()
    ctx.arc(0, 0, baseSize / 12, Math.PI, 1.25 * Math.PI)
    ctx.shadowColor = colorMapper.white
    ctx.shadowBlur = baseSize / 8
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    ctx.strokeStyle = 'rgba(255,255,255,0.65)'
    ctx.lineCap = 'round'
    ctx.lineWidth = baseSize / 16
    ctx.stroke()
    ctx.restore()

    ctx.restore()
  })
}

export const createGameInterface = (resource: any, baseSize = 128): GameInterface => {
  const emitter = mitt<ClientEvents>()

  const padding = baseSize * 1.25
  let ratio = 1

  const [innerWidth, innerHeight] = [
    baseSize * 8,
    baseSize * 9
  ]
  const [width, height] = [
    innerWidth + padding,
    innerHeight + padding
  ]

  // 主画布（棋子）
  const mainCanvas = createCanvas(width, height)
  const ctx = mainCanvas.getContext('2d')!

  const sizeOptions: SizeOptions = {
    width,
    height,
    innerWidth,
    innerHeight,
    baseSize,
    padding,
    rotate: 0,
    fixedOrigin: (rotate: number, $ctx = ctx) => {
      $ctx.translate(width / 2, height / 2)
      $ctx.rotate(rotate)
      $ctx.translate(-innerWidth / 2, -innerHeight / 2)
    }
  }

  // 背景画布（棋盘）
  const checkerBoardCanvas = createCanvas(width, height)
  // 底层动画画布（负责绘制棋子底下动画，位于棋子与棋盘的中间）
  const bottomAnimationCanvas = createCanvas(width, height)
  // 顶层动画画布（负责绘制提示类动画，位于棋子上一层）
  const topAnimationCanvas = createCanvas(width, height)

  let animations: AnimationReturnType

  const mount = (parentNode: Element): void => {
    const rect = parentNode.getBoundingClientRect()
    ratio = rect.width < rect.height
      ? rect.width / parseInt(mainCanvas.style.width)
      : rect.height / parseInt(mainCanvas.style.height)

    drawCheckerboard(checkerBoardCanvas.getContext('2d')!, sizeOptions, resource)

    const oInterface = document.createElement('div')
    oInterface.style.cssText = 'position: absolute;' +
      'left: 50%;' +
      'top: 50%;' +
      'transform-origin: center center;' +
      `transform: translate(-50%, -50%) scale(${ratio})`

    checkerBoardCanvas.style.position = mainCanvas.style.position = bottomAnimationCanvas.style.position = topAnimationCanvas.style.position = 'absolute'
    checkerBoardCanvas.style.left = mainCanvas.style.left = bottomAnimationCanvas.style.left = topAnimationCanvas.style.left = '0'
    checkerBoardCanvas.style.top = mainCanvas.style.top = bottomAnimationCanvas.style.top = topAnimationCanvas.style.top = '0'

    topAnimationCanvas.style.pointerEvents = 'none'

    bottomAnimationCanvas.style.zIndex = '1'
    mainCanvas.style.zIndex = '2'
    topAnimationCanvas.style.zIndex = '3'

    oInterface.appendChild(checkerBoardCanvas)
    oInterface.appendChild(bottomAnimationCanvas)
    oInterface.appendChild(mainCanvas)
    oInterface.appendChild(topAnimationCanvas)

    oInterface.style.width = checkerBoardCanvas.style.width
    oInterface.style.height = checkerBoardCanvas.style.height

    parentNode.appendChild(oInterface)

    animations = createAnimation(topAnimationCanvas.getContext('2d')!, {
      width,
      height,
      baseSize,
      resource: {
        sword: resource.sword,
        win: resource.win
      }
    }, emitter)

    emitter.emit('mounted')
  }

  const destroy = (parentNode: Element): void => {
    parentNode.innerHTML = ''

    emitter.emit('destroyed')
  }

  const getPointer = (e: MouseEvent): Point => {
    const { clientX, clientY } = e
    const { left, top } = mainCanvas.getBoundingClientRect()
    const { rotate } = sizeOptions

    const x = Math.round(((clientX - left) / ratio - padding / 2) / baseSize) + 1
    const y = Math.round(((clientY - top) / ratio - padding / 2) / baseSize) + 1

    return {
      x: rotate === 0 ? x : 10 - x,
      y: rotate === 0 ? y : 11 - y
    }
  }

  const activePieceAnimation = registerActivePieceAnimation(bottomAnimationCanvas.getContext('2d')!, sizeOptions)

  return {
    mainCanvas,
    checkerBoardCanvas,

    get sizeOptions () {
      return sizeOptions
    },

    get animations () {
      if (!animations) {
        throw new Error('Please call `mount()` first.')
      }
      return animations
    },

    on: emitter.on,

    mount,
    destroy,
    getPointer,

    clearMain: () => {
      const ctx = mainCanvas.getContext('2d')!
      ctx.clearRect(0, 0, width, height)
    },

    clearAll: () => {
      [mainCanvas, /* checkerBoardCanvas, */bottomAnimationCanvas, topAnimationCanvas].forEach(c => {
        const { width, height } = c
        c.getContext('2d')!.clearRect(0, 0, width, height)
      })
      activePieceAnimation.stop()

      animations.clear()
    },

    setRotate: (angle: number) => {
      sizeOptions.rotate = angle

      drawCheckerboard(checkerBoardCanvas.getContext('2d')!, sizeOptions, resource)
    },

    setResource: (resource: any) => {
      animations.setResource(resource)
      drawCheckerboard(checkerBoardCanvas.getContext('2d')!, sizeOptions, resource)
    },

    activePieceAnimation,

    drawChessPieces: (chessPieces: ChessPiece[]) => drawChessPieces(ctx, sizeOptions, chessPieces),
    drawLastStop: (point: Point, camp: Camp) => drawLastStop(bottomAnimationCanvas.getContext('2d')!, sizeOptions, point, camp),
    drawCurrentStop: (point: Point, camp: Camp) => drawCurrentStop(bottomAnimationCanvas.getContext('2d')!, sizeOptions, point, camp),
    drawMovePath: (points: Point[]) => drawMovePath(topAnimationCanvas.getContext('2d')!, sizeOptions, points),
    drawAllowPoints: (points: Point[]) => drawAllowPoints(topAnimationCanvas.getContext('2d')!, sizeOptions, points)
  }
}
