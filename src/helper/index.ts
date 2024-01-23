import { Camp, GameStatus, IntMap, defaultAllowPoints } from '../definitions'
import ChessPiece from '../libs/ChessPiece'
import Point from '../libs/Point'
import type { ChessPieceValue, NearestPieces } from '../types/chessPiece'
import { ChessManual, GameContext, MockMoveResult, Players } from '../types/helper'

export const inRange = (val: number, [min, max]: [number, number]): boolean =>
  val >= min && val <= max

export const getDiffVal = (v1: number, v2: number): number =>
  Math.abs(v1 - v2)

export const isEqual = (v1: unknown, v2: unknown): boolean =>
  v1 === v2

export const isSameCoord = ({ x: x1, y: y1 }: Point, { x: x2, y: y2 }: Point): boolean =>
  x1 === x2 && y1 === y2

export const switchCamp = (camp: Camp): Camp =>
  camp === Camp.BLACK ? Camp.RED : Camp.BLACK

export const isMovable = ({ x, y }: Point, allowPoints: Point[]): boolean =>
  allowPoints.some(p => p.x === x && p.y === y)

/** 翻转红方的 x 轴坐标 */
export const reverseRedCampXAxis = (x: number) => 10 - x

export const initChessPieces = (): ChessPiece[] => {
  return ([
    [11],
    [12, 12],
    [13, 13],
    [14, 14],
    [15, 15],
    [16, 16],
    [17, 17, 17, 17, 17],
    [21],
    [22, 22],
    [23, 23],
    [24, 24],
    [25, 25],
    [26, 26],
    [27, 27, 27, 27, 27]
  ] as ChessPieceValue[][]).reduce((list: ChessPiece[], item) => {
    return list.concat(item.map((value, index) => {
      return new ChessPiece(value, index)
    }))
  }, [])
}

const getTheNearestPiece = (piece: ChessPiece, pieces: ChessPiece[]): NearestPieces => {
  const n: NearestPieces = {}

  for (let x = piece.coord.x - 1; x >= 1; x--) {
    n.left = pieces.find(p => p.coord.x === x && p.coord.y === piece.coord.y)
    if (n.left) {
      break
    }
  }
  for (let x = piece.coord.x + 1; x <= 9; x++) {
    n.right = pieces.find(p => p.coord.x === x && p.coord.y === piece.coord.y)
    if (n.right) {
      break
    }
  }

  for (let y = piece.coord.y - 1; y >= 1; y--) {
    n.top = pieces.find(p => p.coord.y === y && p.coord.x === piece.coord.x)
    if (n.top) {
      break
    }
  }
  for (let y = piece.coord.y + 1; y <= 10; y++) {
    n.bottom = pieces.find(p => p.coord.y === y && p.coord.x === piece.coord.x)
    if (n.bottom) {
      break
    }
  }

  return n
}

export const getAllowPoints = (piece: ChessPiece, pieces: ChessPiece[]): Point[] => {
  let points: Point[] = defaultAllowPoints[piece.value](piece.coord)

  const { camp, value, coord } = piece

  let n: NearestPieces

  // 过滤无效坐标
  points = points.filter(({ x, y }) => !(x < 1 || x > 9 || y < 1 || y > 10))

  switch (value) {
    case 12:
    case 22:
      // 车
      n = getTheNearestPiece(piece, pieces)

      // 过滤被阻碍的位置
      points = points.filter(({ x, y }) => {
        return x >= (n.left?.coord?.x || 1) &&
          x <= (n.right?.coord?.x || 9) &&
          y >= (n.top?.coord?.y || 1) &&
          y <= (n.bottom?.coord?.y || 10)
      })
      break

    case 14:
    case 24:
      // 炮
      // 找出最近的炮台
      n = getTheNearestPiece(piece, pieces)
      // 基于炮台，找出最近可击打的棋子
      // eslint-disable-next-line no-case-declarations
      const targets: ChessPiece[] = []
      // eslint-disable-next-line no-case-declarations
      let targetN: NearestPieces
      if (n.left) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        targetN = getTheNearestPiece(n.left, pieces.filter(p => p.coord.y === coord.y && p.coord.x < n.left!.coord.x))
        if (targetN?.left && targetN.left.camp !== camp) {
          targets.push(targetN.left)
        }
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        points = points.filter(({ x }) => x > n.left!.coord.x)
      }
      if (n.right) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        targetN = getTheNearestPiece(n.right, pieces.filter(p => p.coord.y === coord.y && p.coord.x > n.right!.coord.x))
        if (targetN?.right && targetN.right.camp !== camp) {
          targets.push(targetN.right)
        }
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        points = points.filter(({ x }) => x < n.right!.coord.x)
      }
      if (n.top) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        targetN = getTheNearestPiece(n.top, pieces.filter(p => p.coord.x === coord.x && p.coord.y < n.top!.coord.y))
        if (targetN?.top && targetN.top.camp !== camp) {
          targets.push(targetN.top)
        }
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        points = points.filter(({ y }) => y > n.top!.coord.y)
      }
      if (n.bottom) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        targetN = getTheNearestPiece(n.bottom, pieces.filter(p => p.coord.x === coord.x && p.coord.y > n.bottom!.coord.y))
        if (targetN?.bottom && targetN.bottom.camp !== camp) {
          targets.push(targetN.bottom)
        }
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        points = points.filter(({ y }) => y < n.bottom!.coord.y)
      }

      // 再把可击杀目标加上
      points = [
        ...points,
        ...targets.map(({ coord }) => coord)
      ]

      break

    case 13:
    case 23:
      // 马脚
      points = points.filter(({ x, y }) => {
        if (x - coord.x === 2) {
          // 横向：目标点在右上或右下
          return !pieces.find(p => p.coord.x === coord.x + 1 && p.coord.y === coord.y)
        } else if (x - coord.x === -2) {
          // 横向：目标点在左上或左下
          return !pieces.find(p => p.coord.x === coord.x - 1 && p.coord.y === coord.y)
        } else if (y - coord.y === 2) {
          // 纵向：目标点在右上或右下
          return !pieces.find(p => p.coord.x === coord.x && p.coord.y === coord.y + 1)
        } else if (y - coord.y === -2) {
          // 纵向：目标点在左上或左下
          return !pieces.find(p => p.coord.x === coord.x && p.coord.y === coord.y - 1)
        }

        return true
      })
      break

    case 15:
    case 25:
      // 象
      points = points.filter(({ x, y }) => {
        if (coord.x < x) {
          if (coord.y < y) {
            // 目标点在右下
            return !pieces.find(p => p.coord.x === coord.x + 1 && p.coord.y === coord.y + 1)
          }
          // 目标点在右上
          return !pieces.find(p => p.coord.x === coord.x + 1 && p.coord.y === coord.y - 1)
        } else {
          if (coord.y < y) {
            // 目标点在左下
            return !pieces.find(p => p.coord.x === coord.x - 1 && p.coord.y === coord.y + 1)
          }
          // 目标点在左上
          return !pieces.find(p => p.coord.x === coord.x - 1 && p.coord.y === coord.y - 1)
        }
      })
      break

    default:
      break
  }

  points = points
    // 过滤已方棋子所在点
    .filter(point => {
      return !pieces.find(p => p.camp === piece.camp && p.coord.x === point.x && p.coord.y === point.y)
    })
    // 过滤不可移动的点
    .filter(point => mockMove(piece, point, pieces) !== 'not-allow')

  return points
}

export const getPieceByPoint = (point: Point, chessPieces?: ChessPiece[]): ChessPiece | undefined => {
  return (chessPieces ?? []).find(({ coord }) => coord.x === point.x && coord.y === point.y)
}

/**
 * 是否会死
 *
 * 1. 是否对将
 * 2. 上下左右四个方位是否有对方的兵或卒
 * 3. 上下左右四个方位是否有对方的车
 * 4. 上下左右四个方位是否存在对方炮，并且有炮台
 * 5. 周边是否存在对方未被卡角的马
 */
export const isKingWillDie = (king: ChessPiece, pieces: ChessPiece[]): boolean => {
  const menaceList: ChessPiece[] = []
  if (!king) {
    return false
  }

  const { coord, camp } = king

  // 取出离最近的棋子
  const n = getTheNearestPiece(king, pieces)

  Object.entries(n).forEach(([key, value]) => {
    if (value) {
      if (value.camp !== camp) {
        if (getDiffVal(value.coord.y, coord.y) === 1 || getDiffVal(value.coord.x, coord.x) === 1) {
          // 兵/卒/车在旁边
          if ((camp === Camp.RED ? [22, 27] : [12, 17]).includes(value.value)) {
            menaceList.push(value)
          }
        } else {
          // 车在同轴
          if ((camp === Camp.RED ? [22] : [12]).includes(value.value)) {
            menaceList.push(value)
          }

          // 对将
          if ((camp === Camp.RED ? [21] : [11]).includes(value.value)) {
            menaceList.push(value)
          }
        }
      }

      // 隔着炮台是否还有将
      const newN = getTheNearestPiece(value, pieces)
      const segregativePiece = newN[key as keyof NearestPieces]

      if (segregativePiece) {
        if ((segregativePiece.value === (camp === Camp.RED ? 24 : 14)) && segregativePiece.camp !== camp) {
          menaceList.push(segregativePiece)
        }
      }
    }
  })

  // 马
  menaceList.push(...[
    new Point(coord.x + 2, coord.y + 1),
    new Point(coord.x + 2, coord.y - 1),
    new Point(coord.x - 2, coord.y + 1),
    new Point(coord.x - 2, coord.y - 1),
    new Point(coord.x + 1, coord.y + 2),
    new Point(coord.x + 1, coord.y - 2),
    new Point(coord.x - 1, coord.y + 2),
    new Point(coord.x - 1, coord.y - 2)
  ]
    .filter(({ x, y }) => (
      x >= 1 &&
      x <= 9 &&
      y >= 1 &&
      y <= 10
    ))
    .map(point => getPieceByPoint(point, pieces))
    .filter(p => p?.value === (camp === Camp.RED ? 23 : 13))
    .filter(p => {
      // 过滤掉被卡马角的
      return !!getAllowPoints(p!, pieces).find(point => point.x === coord.x && point.y === coord.y)
    }) as ChessPiece[]
  )

  return menaceList.length > 0
}

/**
 * 模拟移动棋子，检测当前移动会不会造成已方死亡、或者给对方将军
 * @returns 'not-allow' | 'check' | 'allow'
 * - 'not-allow': 不允许移动，当前操作会造成已方死亡
 * - 'check': 允许移动，当前操作会给对方将军
 * - 'allow': 允许移动
 */
export const mockMove = (piece: ChessPiece, targetPoint: Point, pieces: ChessPiece[]): MockMoveResult => {
  const newPieces = (getPieceByPoint(targetPoint, pieces)
    ? pieces.map(p => {
      // 模拟移动
      if (p.coord.x === targetPoint.x && p.coord.y === targetPoint.y) {
        return {
          ...piece,
          coord: targetPoint
        } as ChessPiece
      }

      return p
    })
    : [...pieces, {
      ...piece,
      coord: targetPoint
    }] as ChessPiece[]
  ).filter(p => !isSameCoord(piece.coord, p.coord))

  const ourCamp = piece.camp

  const ourKing = newPieces.find(p => p.value === (ourCamp === Camp.RED ? 11 : 21))!
  const enemyKing = newPieces.find(p => p.value === (ourCamp === Camp.RED ? 21 : 11))!

  // 先检测已方是否暴毙
  if (isKingWillDie(ourKing, newPieces)) {
    return 'not-allow'
  }

  // 检测是否给对方造成将军
  if (isKingWillDie(enemyKing, newPieces)) {
    return 'check'
  }

  return 'allow'
}

// 是否绝杀
export const isCheckMate = (camp: Camp, chessPieces: ChessPiece[]): boolean => {
  const enemyPieceList: ChessPiece[] = chessPieces.filter(item => item.camp !== camp)

  return enemyPieceList.every(piece => {
    const list = getAllowPoints(piece, chessPieces)

    return list.every(point => {
      return mockMove(piece, point, chessPieces) === 'not-allow'
    })
  })
}

/**
 * 记录棋谱
 *
 *
 * 注意：
 * 1. 棋子坐标以红方为主视角，左边顶点为坐标原点(1,1)
 * 2. 红方：当 y 轴坐标减少时为 “进”，增加时为 “退”，否则为 “平”
 * 3. 黑方：当 y 轴坐标减少时为 “退”，增加时为 “进”，否则为 “平”
 * 4. 当车、马、炮、兵/卒有 2 个（或 3 个：兵/卒）在同一条 x 轴时，使用 “前”、“中”、“后” 区分
 * 5. 当兵/卒超过 3 个在同一条 x 轴时，以 y 轴大小进行数字编号（一二...五 / 1 2 ... 5）区分
 * 6. 马、士、象非直线走位需要特殊处理一下
 *
 * @param piece - 当前棋子
 * @param targetPoint - 目标坐标
 * @param chessPieces - 棋盘上剩余棋子
 */
export const recordManual = (piece: ChessPiece, targetPoint: Point, chessPieces: ChessPiece[]): ChessManual => {
  const { camp, coord: { x, y }, value } = piece

  const text = generateManual(camp, piece, targetPoint)

  if ([11, 21, 15, 25, 16, 26].includes(value)) {
    return {
      camp,
      value: text
    }
  }

  const sameXAxisPieces = chessPieces.filter(p => p.value === value && p.coord.x === x && p.coord.y !== y)

  if (sameXAxisPieces.length === 0) {
    return {
      camp,
      value: text
    }
  }

  if (sameXAxisPieces.length === 1) {
    return {
      camp,
      value: `${
        y - sameXAxisPieces[0].coord.y > 0
          ? camp === Camp.RED ? '后' : '前'
          : camp === Camp.RED ? '前' : '后'
      }${piece.name}${text.slice(2)}`
    }
  }

  let index = 1
  sameXAxisPieces.sort((a, b) => a.coord.y - b.coord.y).some(p => {
    if (y > p.coord.y) {
      index++
      return false
    }

    return true
  })

  if (sameXAxisPieces.length === 2) {
    return {
      camp,
      value: `${
        camp === Camp.RED
          ? ['', '前', '中', '后'][index]
          : ['', '后', '中', '前'][index]
      }${piece.name}${text.slice(2)}`
    }
  }

  return {
    camp,
    value: `${
      camp === Camp.RED
        ? index
        : IntMap[index]
    }${piece.name}${text.slice(2)}`
  }
}

export const generateManual = (currentCamp: Camp, { name, coord, value }: ChessPiece, { x, y }: Point): string => {
  /** 目标点 y 轴与棋子坐标 y 轴的差值 */
  const step: number = y - coord.y

  const isRedCamp = currentCamp === Camp.RED

  const specialValue = [13, 23, 15, 25, 16, 26]

  const source = isRedCamp ? reverseRedCampXAxis(coord.x) : IntMap[coord.x]
  let dir = '进'
  let target: number | string = ''

  if (step > 0) {
    // 红: 正数为退 负数为进
    // 黑: 正数为进 负数为退
    dir = '进'

    if (isRedCamp) {
      dir = '退'
      target = specialValue.includes(value)
        ? reverseRedCampXAxis(x)
        : step
    } else {
      target = IntMap[specialValue.includes(value)
        ? x
        : step
      ]
    }
  } else if (step < 0) {
    // 红: 正数为退 负数为进
    // 黑: 正数为进 负数为退
    dir = '退'

    if (isRedCamp) {
      dir = '进'
      target = specialValue.includes(value)
        ? reverseRedCampXAxis(x)
        : Math.abs(step)
    } else {
      target = IntMap[specialValue.includes(value)
        ? x
        : Math.abs(step)
      ]
    }
  } else {
    // 否则的话就是平
    dir = '平'
    target = isRedCamp ? reverseRedCampXAxis(x) : IntMap[x]
  }

  return `${name}${source}${dir}${target}`
}

export const createContext = (players: null | Players = null): GameContext => {
  return {
    status: GameStatus.Init,
    players,
    firstCamp: Camp.RED,
    currentCamp: Camp.RED,
    manual: [],
    chessPieces: initChessPieces(),
    counter: 0,
    movePath: [],
    activePiece: null,
    allowPoints: [],
    message: []
  }
}

export const getFirstCamp = (players: Players): Camp => {
  // roll 点先手
  if (players[Camp.RED]!.firstCamp !== players[Camp.BLACK]!.firstCamp) {
    return Math.random() > 0.5
      ? Camp.RED
      : Camp.BLACK
  }

  return players[Camp.RED]!.firstCamp
}

const parseManual = ({ camp, value }: ChessManual, chessPieces: ChessPiece[]): null | { piece: ChessPiece, point: Point } => {
  const [w1, w2, w3, w4] = value.split('')

  let piece: ChessPiece | null = null
  let point: Point | null = null

  if (['前', '中', '后', '一', '二', '三', '四', '五', '1', '2', '3', '4', '5'].includes(w1)) {
    const temp = chessPieces.filter(p => p.name === w2 && p.camp === camp).sort((a, b) => {
      return camp === Camp.RED
        ? a.coord.y - b.coord.y
        : b.coord.y - a.coord.y
    })
    if ([0, 1].includes(temp.length)) {
      return null
    }

    if (temp.length === 2) {
      piece = w1 === '前'
        ? temp[0]
        : w1 === '后'
          ? temp[1]
          : null
    } else if (temp.length === 3) {
      piece = w1 === '前'
        ? temp[0]
        : w1 === '中'
          ? temp[1]
          : w1 === '后'
            ? temp[2]
            : null
    } else {
      const idx = /\d/.test(w1) ? Number(w1) : ((IntMap[w1 as any] as any) - 1)
      if (Number.isNaN(idx) || idx < 0 || idx > 4) {
        return null
      }
      piece = temp[idx]
    }

    if (!piece) {
      return null
    }
  } else {
    piece = chessPieces.find(p =>
      p.camp === camp &&
      p.name === w1 &&
      p.coord.x === (camp === Camp.RED ? reverseRedCampXAxis(Number(w2)) : (IntMap[w2 as any] as any))
    ) ?? null
  }

  if (!piece) {
    return null
  }

  const { coord: { x, y } } = piece

  const specialValue = [13, 23, 15, 25, 16, 26]

  switch (w3) {
    case '进':
      if (camp === Camp.RED) {
        if (specialValue.includes(piece.value)) {
          point = new Point(
            reverseRedCampXAxis(Number(w4)),
            piece.value === 16 // 士
              ? y - 1
              : piece.value === 15 // 象
                ? y - 2
                : Math.abs(reverseRedCampXAxis(x) - Number(w4)) === 1 // 马
                  ? y - 2
                  : y - 1
          )
        } else {
          point = new Point(x, y - Number(w4))
        }
      } else {
        if (specialValue.includes(piece.value)) {
          point = new Point(
            IntMap[w4 as any] as any,
            piece.value === 26 // 士
              ? y + 1
              : piece.value === 25 // 象
                ? y + 2
                : Math.abs(x - (IntMap[w4 as any] as any)) === 1 // 马
                  ? y + 2
                  : y + 1
          )
        } else {
          point = new Point(x, y + (IntMap[w4 as any] as any))
        }
      }
      break

    case '退':
      if (camp === Camp.RED) {
        if (specialValue.includes(piece.value)) {
          point = new Point(
            reverseRedCampXAxis(Number(w4)),
            piece.value === 16 // 士
              ? y + 1
              : piece.value === 15 // 象
                ? y + 2
                : Math.abs(reverseRedCampXAxis(x) - Number(w4)) === 1 // 马
                  ? y + 2
                  : y + 1
          )
        } else {
          point = new Point(x, y + Number(w4))
        }
      } else {
        if (specialValue.includes(piece.value)) {
          point = new Point(
            IntMap[w4 as any] as any,
            piece.value === 26 // 士
              ? y - 1
              : piece.value === 25 // 象
                ? y - 2
                : Math.abs(x - (IntMap[w4 as any] as any)) === 1 // 马
                  ? y - 2
                  : y - 1
          )
        } else {
          point = new Point(x, y - (IntMap[w4 as any] as any))
        }
      }
      break
    case '平':
      point = new Point(camp === Camp.RED ? reverseRedCampXAxis(Number(w4)) : IntMap[w4 as any] as any, y)
      break
  }

  if (!point) {
    return null
  }

  return {
    piece,
    point
  }
}

/**
 * 将棋谱转成棋局
 */
export const generateChessPiecesByManual = (manual: ChessManual[]) => {
  let chessPieces = initChessPieces()
  const { length } = manual

  if (length === 0) {
    return {
      firstCamp: Camp.RED,
      currentCamp: Camp.RED,
      chessPieces
    }
  }

  const firstCamp = manual[0].camp
  let currentCamp = firstCamp
  let item: ChessManual

  for (let i = 0; i < length; i++) {
    item = manual[i]

    if (currentCamp !== item.camp) {
      throw new Error('棋谱存在问题，无法解析')
    }

    const res = parseManual(item, chessPieces)
    if (!res) {
      throw new Error('棋谱存在问题，无法解析')
    }

    const { piece, point } = res

    if (mockMove(piece, point, chessPieces) === 'not-allow') {
      throw new Error('棋谱存在问题，无法解析')
    }

    const targetPiece = getPieceByPoint(point, chessPieces)
    if (targetPiece) {
      // 击杀位置所在敌方棋子
      chessPieces = chessPieces.filter(p => p !== targetPiece)
    }

    ChessPiece.move(piece, point)

    if (isCheckMate(currentCamp, chessPieces)) {
      return {
        firstCamp,
        currentCamp,
        chessPieces,
        status: GameStatus.Finished
      }
    }
    currentCamp = switchCamp(currentCamp)
  }

  return {
    firstCamp,
    currentCamp,
    chessPieces
  }
}
