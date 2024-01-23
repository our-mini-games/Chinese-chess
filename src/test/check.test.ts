import { describe, expect, test } from 'vitest'
import { P, isArrayEqual } from './helper'

import { generateChessPiecesByManual, getAllowPoints, isCheckMate, mockMove } from '../helper'
import ChessPiece from '../libs/ChessPiece'
import checkMateManuals from './checkMate.json'
import { ChessManual } from '../types/helper'

// 车:Rooks
// 马:Knights (Mao)
// 象/相:Elephants
// 士/仕:Mandarins
// 将/帅:King /General
// 炮:Cannons (Pao)
// 卒/兵:Pawns

describe('应该可以塞马脚', () => {
  const mandarin1 = new ChessPiece(16)
  const mandarin2 = new ChessPiece(16, 1)
  const king = new ChessPiece(11)
  const knight = new ChessPiece(13)

  const blackKnight = new ChessPiece(23)
  const general = new ChessPiece(21)

  ChessPiece.move(mandarin1, P(4, 1))
  ChessPiece.move(mandarin2, P(6, 1))
  ChessPiece.move(king, P(5, 1))
  ChessPiece.move(knight, P(5, 4))

  ChessPiece.move(blackKnight, P(4, 3))
  ChessPiece.move(general, P(6, 10))

  const chessPieces = [mandarin1, mandarin2, king, knight, blackKnight, general]

  test('allow points', () => {
    isArrayEqual(
      getAllowPoints(knight, chessPieces), // 红马
      [
        P(4, 2)
      ]
    )
  })

  test('movable', () => {
    expect(mockMove(knight, P(4, 2), chessPieces)).toBe('allow')
  })
})

describe('绝杀局', () => {
  checkMateManuals.forEach((manual, index) => {
    test(`${index} 应该绝杀`, () => {
      const newValue = generateChessPiecesByManual(manual as unknown as ChessManual[])

      expect(newValue.currentCamp).toBeTruthy()
      expect(newValue.firstCamp).toBeTruthy()
      expect(Array.isArray(newValue.chessPieces)).toBeTruthy()

      const isGG = isCheckMate(newValue.currentCamp, newValue.chessPieces)

      expect(isGG).toBeTruthy()
    })
  })
})
