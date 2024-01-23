/* eslint-disable no-unused-vars */
import Point from '../libs/Point'
import { ChessPieceMapItem, ChessPieceValue } from '../types/chessPiece'

const P = (x: number, y: number) => new Point(x, y)

export enum Camp {
  RED = 'red',
  BLACK = 'black'
}

export enum GameStatus {
  Init = 'INIT',
  Playing = 'PLAYING',
  Paused = 'PAUSED',
  Finished = 'FINISHED'
}

export const colorMapper = {
  // 阵营颜色
  red: '#E94709', // 朱砂
  black: '#2C2F3B', // 绀蝶

  line: '#B2BFC3', // 逍遥游，用于线条
  // light: '#DCE4E8', // 浅云，用于亮面
  // dark: '#D4DDE1', // 素采，用于暗面
  light: '#DAE9F4',
  dark: '#363433',
  redLight: '#D34537',
  redDark: '#D32B22',
  blackLight: '#2D2F3C',
  blackDark: '#161C28',
  // shadow: '#BDCBD2', // 影青 // #bbb 用于阴影
  shadow: '#595347', // 影青 // #bbb 用于阴影

  // success: '#84A729', // 水龙吟
  success: '#68935C',
  error: '#D24735', // 鹤顶红
  white: '#FFF'
}

export const chessPieceMapper: Record<ChessPieceValue, ChessPieceMapItem> = {
  11: { camp: Camp.RED, name: '帅', coords: [P(5, 10)] },
  12: { camp: Camp.RED, name: '车', coords: [P(1, 10), P(9, 10)] },
  13: { camp: Camp.RED, name: '马', coords: [P(2, 10), P(8, 10)] },
  14: { camp: Camp.RED, name: '炮', coords: [P(2, 8), P(8, 8)] },
  15: { camp: Camp.RED, name: '相', coords: [P(3, 10), P(7, 10)] },
  16: { camp: Camp.RED, name: '仕', coords: [P(4, 10), P(6, 10)] },
  17: { camp: Camp.RED, name: '兵', coords: [P(1, 7), P(3, 7), P(5, 7), P(7, 7), P(9, 7)] },

  21: { camp: Camp.BLACK, name: '将', coords: [P(5, 1)] },
  22: { camp: Camp.BLACK, name: '车', coords: [P(1, 1), P(9, 1)] },
  23: { camp: Camp.BLACK, name: '马', coords: [P(2, 1), P(8, 1)] },
  24: { camp: Camp.BLACK, name: '炮', coords: [P(2, 3), P(8, 3)] },
  25: { camp: Camp.BLACK, name: '象', coords: [P(3, 1), P(7, 1)] },
  26: { camp: Camp.BLACK, name: '士', coords: [P(4, 1), P(6, 1)] },
  27: { camp: Camp.BLACK, name: '卒', coords: [P(1, 4), P(3, 4), P(5, 4), P(7, 4), P(9, 4)] }
}

export const defaultAllowPoints: Record<ChessPieceValue, (p: Point) => Point[]> = {
  11: ({ x, y }) => {
    return [
      P(x - 1, y), P(x + 1, y),
      P(x, y - 1), P(x, y + 1)
    ].filter(p => !(p.x < 4 || p.x > 6 || p.y < 8 || p.y > 10))
  },
  12: ({ x, y }) => {
    const points: Point[] = []
    // 取 x 轴上除了当前点的所有点
    for (let i = 1; i <= 9; i++) {
      if (i === x) continue
      points.push(P(i, y))
    }
    // 取 y 轴上除了当前点的所有点
    for (let j = 1; j <= 10; j++) {
      if (j === y) continue
      points.push(P(x, j))
    }

    return points
  },
  13: ({ x, y }: Point) => {
    return [
      P(x - 2, y + 1), P(x - 2, y - 1),
      P(x + 2, y + 1), P(x + 2, y - 1),
      P(x - 1, y - 2), P(x + 1, y - 2),
      P(x - 1, y + 2), P(x + 1, y + 2)
    ].filter(p => !(p.x < 1 || p.x > 9 || p.y < 1 || p.y > 10 || (p.x === x && p.y === y)))
  },
  14: (point: Point) => defaultAllowPoints[12](point),
  15: ({ x, y }: Point) => {
    return [
      P(x + 2, y + 2), P(x + 2, y - 2),
      P(x - 2, y + 2), P(x - 2, y - 2)
    ].filter(p => !(p.x < 1 || p.x > 9 || p.y < 6 || p.y > 10 || (p.x === x && p.y === y)))
  },
  16: ({ x, y }: Point) => {
    return [
      P(x + 1, y + 1), P(x + 1, y - 1),
      P(x - 1, y + 1), P(x - 1, y - 1)
    ].filter(p => !(p.x < 4 || p.x > 6 || p.y < 8 || p.y > 10 || (p.x === x && p.y === y)))
  },
  17: ({ x, y }: Point) => {
    if (y > 5) {
      return [P(x, y - 1)]
    }

    return [
      P(x - 1, y), P(x + 1, y), P(x, y - 1)
    ]
  },
  21: ({ x, y }: Point) => {
    return [
      P(x - 1, y), P(x + 1, y),
      P(x, y - 1), P(x, y + 1)
    ].filter(p => !(p.x < 4 || p.x > 6 || p.y < 1 || p.y > 3))
  },
  22: (point: Point) => defaultAllowPoints[12](point),
  23: (point: Point) => defaultAllowPoints[13](point),
  24: (point: Point) => defaultAllowPoints[14](point),
  25: ({ x, y }: Point) => {
    return [
      P(x + 2, y + 2), P(x + 2, y - 2),
      P(x - 2, y + 2), P(x - 2, y - 2)
    ].filter(p => !(p.x < 1 || p.x > 9 || p.y < 1 || p.y > 5 || (p.x === x && p.y === y)))
  },
  26: ({ x, y }: Point) => {
    return [
      P(x + 1, y + 1), P(x + 1, y - 1),
      P(x - 1, y + 1), P(x - 1, y - 1)
    ].filter(p => !(p.x < 4 || p.x > 6 || p.y < 1 || p.y > 3 || (p.x === x && p.y === y)))
  },
  27: ({ x, y }: Point) => {
    if (y < 6) {
      return [P(x, y + 1)]
    }

    return [
      P(x - 1, y), P(x + 1, y), P(x, y + 1)
    ]
  }
}

export enum IntMap {
  一 = 1,
  二 = 2,
  三 = 3,
  四 = 4,
  五 = 5,
  六 = 6,
  七 = 7,
  八 = 8,
  九 = 9
}
