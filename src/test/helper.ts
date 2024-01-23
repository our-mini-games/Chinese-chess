import { expect } from 'vitest'
import Point from '../libs/Point'
import ChessPiece from '../libs/ChessPiece'
import { Camp } from '../definitions'

const defaultBoard = (() => {
  let x = 1
  let y = 1
  return '┌─┬─┬─┬─┬─┬─┬─┬─┐├─┼─┼─┼─┼─┼─┼─┼─┤├─╬─┼─┼─┼─┼─┼─╬─┤╠─┼─╬─┼─╬─┼─╬─┼─╣├─┴─┴─┴─┴─┴─┴─┴─┤├─┬─┬─┬─┬─┬─┬─┬─┤╠─┼─╬─┼─╬─┼─╬─┼─╣├─╬─┼─┼─┼─┼─┼─╬─┤├─┼─┼─┼─┼─┼─┼─┼─┤└─┴─┴─┴─┴─┴─┴─┴─┘'
    .split('')
    .reduce((acc, item) => {
      // eslint-disable-next-line prefer-const
      let value: any = { x, y, content: item }
      if (x >= 9) {
        value.isPlaceholder = false
        acc.push(value)
        x = 1
        y++
        return acc
      }
      if (acc.length === 0) {
        value.isPlaceholder = false
        acc.push(value)
        return acc
      }

      if (x === 1 && acc.at(-1).x === 9) {
        value.isPlaceholder = false
        acc.push(value)
        return acc
      }
      if (!acc.at(-1)?.isPlaceholder) {
        value.isPlaceholder = true
        x++
      } else {
        value.isPlaceholder = false
      }

      acc.push(value)
      return acc
    }, [] as any)
})()

export const P = (x: number, y: number): Point => new Point(x, y)

export const isArrayEqual = (arr1: any[], arr2: any[]): void => {
  expect(arr1).toHaveLength(arr2.length)
  expect(arr1).toEqual(expect.arrayContaining(arr2))
}

export const newPieceByPoint = (point: Point, camp: Camp): ChessPiece => {
  const piece = new ChessPiece(camp === Camp.RED ? 14 : 24)
  ChessPiece.move(piece, point)

  return piece
}

/**
 * - 字体颜色
 *    - 黑色 \1b[30m
 *    - 红色 \1b[31m
 *    - 绿色 \1b[32m
 *    - 黄色 \1b[33m
 *    - 蓝色 \1b[34m
 *    - 紫色 \1b[35m
 *    - 天蓝色 \1b[36m
 *    - 白色 \1b[37m
 * - 背景
 *    - 黑色 \1b[40m
 *    - 红色 \1b[41m
 *    - 绿色 \1b[42m
 *    - 黄色 \1b[43m
 *    - 蓝色 \1b[44m
 *    - 紫色 \1b[45m
 *    - 天蓝色 \1b[46m
 *    - 白色 \1b[47m
 * - 控制
 *    - 关闭所有属性 \1b[0m
 *    - 设置高亮度 \1b[1m
 *    - 下划线 \1b[4m
 *    - 闪烁 \1b[5m
 *    - 反显 \1b[7m
 *    - 消隐 \1b[8m
 *    - 设置前景色 30m - 37m
 *    - 设置背景色 40m - 47m
 *    - 光标上移n行 \1b[nA
 *    - 光标下移n行 \1b[nB
 *    - 光标右移n行 \1b[nC
 *    - 光标左移n行 \1b[nD
 *    - 设置光标位置 \1b[y;xH
 *    - 清屏 \1b[2J
 *    - 清除从光标到行尾的内容 \1b[K
 *    - 保存光标位置 \1b[s
 *    - 恢复光标位置 \1b[u
 *    - 隐藏光标 \1b[?25l
 *    - 显示光标 \1b[?25h
 */
export const consoleDraw = (chessPieces: ChessPiece[]) => {
  // console.log(`
  //   车┬─┬─┬─┬─┬─┬─┬─┐
  //   ├─┼─┼─┼─┼─┼─┼─┼─┤
  //   ├─╬─┼─┼─┼─┼─┼─╬─┤
  //   ╠─┼─╬─┼─╬─┼─╬─┼─╣
  //   ├─┴─┴─┴─┴─┴─┴─┴─┤
  //   ├─┬─┬─┬─┬─┬─┬─┬─┤
  //   ╠─┼─╬─┼─╬─┼─╬─┼─╣
  //   ├─╬─┼─┼─┼─┼─┼─╬─┤
  //   ├─┼─┼─┼─┼─┼─┼─┼─┤
  //   └─┴─┴─┴─┴─┴─┴─┴─┘
  // `)

  // eslint-disable-next-line no-console
  console.log(
    defaultBoard.reduce((acc: string, item: any) => {
      const piece = chessPieces.find(i => i.coord.x === item.x && i.coord.y === item.y)
      if (piece) {
        if (!item.isPlaceholder) {
          acc += `${piece.camp === Camp.RED ? '\x1b[31m' : '\x1b[30m'}${piece.name}\x1b[0m`
        }
      } else {
        acc += item.content
      }
      if (item.x === 9) {
        acc += '\n'
      }
      return acc
    }, '')
  )
}
