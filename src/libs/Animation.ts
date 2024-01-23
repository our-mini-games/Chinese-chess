import { Emitter } from 'mitt'
import { Camp, colorMapper } from '../definitions'
import ChessPiece from './ChessPiece'
import Point from './Point'
import { SizeOptions } from './GameInterface'
import { ClientEvents } from '../types/emitter'

export type AnimationType = 'check' | 'check-mate' | 'win'

export interface AnimationOptions {
  width: number
  height: number
  baseSize: number
  resource: {
    sword: HTMLImageElement
    win: HTMLImageElement
  }
}

interface TextItem {
  text: string
  x: number
  y: number
  ratio: number
  color: string
}

interface ImageItem {
  name: keyof AnimationOptions['resource']
  x: number
  y: number
  alpha: number
}

type Circle = [number, number, number]

interface Value {
  text?: TextItem[]
  circle?: Circle[]
  image?: ImageItem
}

interface AnimationExecutor {
  run: () => void
  stop: () => void
}

export interface AnimationReturnType {
  clear: () => void
  stopAll: () => void
  setResource: (resource: any) => void
  check: AnimationExecutor
  checkMate: AnimationExecutor
  blackWin: AnimationExecutor
  redWin: AnimationExecutor
}

export interface ActivePieceAnimation {
  clear: () => void
  run: (chessPiece: ChessPiece, rotate?: number) => void
  stop: () => void
}

export const createAnimation = (
  ctx: CanvasRenderingContext2D,
  { width, height, baseSize, resource }: AnimationOptions,
  emitter: Emitter<ClientEvents>
): AnimationReturnType => {
  function drawText (text: string, x: number, y: number, ratio = 1, color = '#f6d59a'): void {
    ctx.save()
    ctx.scale(ratio, ratio)
    ctx.beginPath()

    const gradient = ctx.createLinearGradient(-0, -2 * Math.abs(x), 0, 2 * Math.abs(y))

    gradient.addColorStop(0, '#fff')
    gradient.addColorStop(0.5, color)
    gradient.addColorStop(1, '#fff')

    ctx.fillStyle = gradient
    ctx.strokeStyle = 'rgba(0,0,0,0.6)'
    ctx.lineWidth = 1

    ctx.font = `normal ${baseSize}px STXINGKAI`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    ctx.shadowBlur = 6
    ctx.shadowColor = 'rgba(0,0,0,0.4)'
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 4

    ctx.fillText(text, x, y)
    ctx.shadowBlur = 0
    ctx.shadowColor = 'rgba(0,0,0,0)'
    ctx.strokeText(text, x, y)
    ctx.restore()
  }

  function drawCirclePoint (x: number, y: number, r: number): void {
    ctx.beginPath()
    ctx.strokeStyle = 'black'
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  function drawImage ({ name, x, y, alpha }: ImageItem): void {
    const img = _resource[name]
    if (!(img instanceof HTMLImageElement)) {
      return
    }
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.drawImage(img, x, y)
    ctx.restore()
  }

  function clear (): void {
    ctx.clearRect(0, 0, width, height)
  }

  function draw (value: Value): void {
    ctx.save()
    ctx.translate(width / 2, height / 2)

    const { text, circle, image } = value

    if (image?.name) {
      drawImage(image)
    }
    if (circle) {
      circle.forEach(item => {
        drawCirclePoint(...item)
      })
    }

    if (text) {
      text.forEach(item => {
        drawText(item.text, item.x, item.y, item.ratio, item.color)
      })
    }

    ctx.restore()
  }

  const registerCheckAnimation = (): AnimationReturnType['check'] => {
    function init (): {
      points: Circle[]
      textList: TextItem[]
      value: Value
      } {
      let r = baseSize / 16
      const outerRadius = baseSize / 2
      const step = Math.PI / 180
      const points: Circle[] = Array.from({ length: 145 }, (_, index) => {
      // eslint-disable-next-line no-return-assign
        return [
          outerRadius * Math.cos(index * 2 * step),
          outerRadius * Math.sin(index * 2 * step),
          (r -= step * 2, Math.max(1, r + step * 2))
        ] as Circle
      })

      const textList = [
        {
          text: '将',
          x: -baseSize / 4,
          y: -baseSize / 6,
          ratio: 2,
          color: '#f6d59a'
        },
        {
          text: '军',
          x: baseSize / 4,
          y: baseSize / 6,
          ratio: 2,
          color: '#f6d59a'
        }
      ]

      const value: Value = {
        text: [textList.shift()!],
        circle: []
      }

      return {
        value,
        textList,
        points
      }
    }

    function run (value: Value, textList: TextItem[], points: Circle[]): void {
      reqId = requestAnimationFrame(() => run(value, textList, points))

      const lastText = value.text!.at(-1)
      if (lastText!.ratio > 1) {
        lastText!.ratio -= 0.1
      } else if (textList.length > 0) {
        value.text!.push(textList.shift()!)
      } else {
        value.circle!.push(
          ...points.splice(0, 5)
        )
      }

      clear()
      draw(value)

      if (points.length <= 0) {
        stop()
      }
    }

    function stop (): void {
      cancelAnimationFrame(reqId)
      emitter.emit('animation:finished', 'check')
    }

    return {
      run: () => {
        const { value, textList, points } = init()
        run(value, textList, points)
      },
      stop
    }
  }

  const registerCheckMateAnimation = (imgName: keyof AnimationOptions['resource']): AnimationReturnType['checkMate'] => {
    function init (): {
      textList: TextItem[]
      value: Value
      } {
      const textList = [
        {
          text: '绝',
          x: -baseSize / 4,
          y: -baseSize / 6,
          ratio: 2,
          color: '#f40'
        },
        {
          text: '杀',
          x: baseSize / 4,
          y: baseSize / 6,
          ratio: 2,
          color: '#f40'
        }
      ]

      const value = {
        text: [textList.shift()!],
        image: {
          name: imgName,
          x: -45,
          y: -64,
          alpha: 0
        }
      }
      return {
        textList,
        value
      }
    }

    function run (value: Value, textList: TextItem[]): void {
      reqId = requestAnimationFrame(() => run(value, textList))

      const lastText = value.text!.at(-1)
      if (lastText!.ratio > 1) {
        lastText!.ratio -= 0.1
      } else if (textList.length > 0) {
        value.text!.push(textList.shift()!)
      } else {
        value.image!.alpha += 0.03
      }

      clear()
      draw(value)

      if (value.image!.alpha > 1) {
        stop()
      }
    }

    function stop (): void {
      cancelAnimationFrame(reqId)

      emitter.emit('animation:finished', 'check-mate')
    }

    return {
      run: () => {
        const { textList, value } = init()
        run(value, textList)
      },
      stop
    }
  }

  const registerWinAnimation = (imgName: keyof AnimationOptions['resource'], camp: Camp): AnimationReturnType['blackWin'] => {
    function init (): { text: TextItem, value: Value } {
      const text: TextItem = {
        text: `${camp === Camp.RED ? '红' : '黑'}胜`,
        x: 0,
        y: baseSize / 2,
        ratio: 2,
        color: camp === Camp.RED ? '#f40' : '#000'
      }

      const value: Value = {
        image: {
          name: imgName,
          x: -145,
          y: -96,
          alpha: 0
        },
        text: []
      }

      return {
        text,
        value
      }
    }

    function run (text: TextItem, value: Value): void {
      reqId = requestAnimationFrame(() => run(text, value))

      if (value.image!.alpha < 1) {
        value.image!.alpha += 0.03
      } else {
        if (value.text!.length === 0) {
          value.text!.push(text)
        }
        const lastText = value.text!.at(-1)!
        if (lastText.ratio > 1) {
          lastText.ratio -= 0.05
        }
      }

      clear()
      draw(value)

      if (value.text?.at(-1) && value.text.at(-1)!.ratio <= 1) {
        stop()
      }
    }

    function stop (): void {
      cancelAnimationFrame(reqId)
      emitter.emit('animation:finished', 'win')
    }

    return {
      run: () => {
        const { text, value } = init()
        run(text, value)
      },
      stop
    }
  }

  let reqId: number

  let _resource = resource

  const check = registerCheckAnimation()
  const checkMate = registerCheckMateAnimation('sword')
  const redWin = registerWinAnimation('win', Camp.RED)
  const blackWin = registerWinAnimation('win', Camp.BLACK)

  return {
    // 应该让外部来关掉这个动画
    clear,
    stopAll: () => {
      check.stop()
      checkMate.stop()
      redWin.run()
      blackWin.stop()
      clear()
    },
    setResource: (resource) => {
      _resource = resource
    },
    check,
    checkMate,
    redWin,
    blackWin
  }
}

export const registerActivePieceAnimation = (ctx: CanvasRenderingContext2D, { baseSize, fixedOrigin }: SizeOptions): ActivePieceAnimation => {
  let counter = 0
  let reqId: number
  let lastTime = Date.now()

  const { width, height } = ctx.canvas

  const clear = () => {
    ctx.clearRect(0, 0, width, height)
  }

  const draw = (point: Point, rotate = 0) => {
    clear()

    const { x, y } = Point.toActualPoint(new Point(point.x - 1, point.y - 1), baseSize)

    ctx.save()
    fixedOrigin(rotate, ctx)

    ctx.beginPath()

    ctx.strokeStyle = colorMapper.white
    ctx.fillStyle = colorMapper.white
    ctx.lineWidth = baseSize * 0.05
    ctx.translate(x, y)
    const displacement = baseSize / 32
    ctx.translate(rotate === 0 ? -displacement : displacement, rotate === 0 ? -displacement : displacement)

    const r = baseSize / 2 - displacement
    const d = Math.PI / 90
    let size = 1
    for (let degree = 0; degree < Math.PI; degree += d) {
      ctx.save()
      ctx.beginPath()
      ctx.fillStyle = `hsl(${(counter / 2) * degree * 90 / Math.PI}, 100%, 60%)`
      ctx.arc(Math.cos(counter * 3 + degree) * r, Math.sin(counter * 3 + degree) * r, size, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      size += 0.1
    }

    ctx.restore()
  }

  const run = (chessPiece: ChessPiece, rotate = 0) => {
    reqId = requestAnimationFrame(() => run(chessPiece, rotate))

    const currTime = Date.now()
    if (currTime - lastTime > 8) {
      counter += Math.PI / 180

      if (counter >= 2 * Math.PI) {
        counter = 0
      }

      draw(chessPiece.coord, rotate)
      lastTime = currTime
    }
  }

  const stop = () => {
    cancelAnimationFrame(reqId)
    clear()
  }

  return {
    clear,
    run,
    stop
  }
}
