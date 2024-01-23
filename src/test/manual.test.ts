import { describe, expect, suite, test } from 'vitest'
import { P } from './helper'
import ChessPiece from '../libs/ChessPiece'
import { generateChessPiecesByManual, recordManual } from '../helper'
import { Camp } from '../definitions'
import { ChessManual } from '../types/helper'
import manuals from './manual.json'

// 车:Rooks
// 马:Knights (Mao)
// 象/相:Elephants
// 士/仕:Mandarins
// 将/帅:King /General
// 炮:Cannons (Pao)
// 卒/兵:Pawns

suite('Manual', () => {
  describe('红马', () => {
    const knight = new ChessPiece(13, 1)

    const list = [
      { source: P(8, 10), target: P(7, 8), value: '马2进3' },
      { source: P(3, 3), target: P(4, 1), value: '马7进6' },
      { source: P(7, 8), target: P(8, 10), value: '马3退2' },
      { source: P(5, 5), target: P(7, 6), value: '马5退3' },
      { source: P(3, 3), target: P(5, 4), value: '马7退5' }
    ]

    test.each(list)('$value', ({ source, target, value }) => {
      ChessPiece.move(knight, source)
      const manual = recordManual(knight, target, [])
      expect(manual).toMatchObject({ camp: 'red', value })
    })
  })

  describe('黑马', () => {
    const knight = new ChessPiece(23, 1)

    const list = [
      { source: P(8, 1), target: P(7, 3), value: '马八进七' },
      { source: P(7, 3), target: P(8, 1), value: '马七退八' },
      { source: P(6, 4), target: P(4, 5), value: '马六进四' },
      { source: P(5, 5), target: P(7, 6), value: '马五进七' },
      { source: P(3, 3), target: P(5, 4), value: '马三进五' }
    ]

    test.each(list)('$value', ({ source, target, value }) => {
      ChessPiece.move(knight, source)
      const manual = recordManual(knight, target, [])
      expect(manual).toMatchObject({ camp: 'black', value })
    })
  })
})

suite('棋谱转成棋局', () => {
  test('悔棋失败', () => {
    const source: ChessManual[] = [
      { camp: Camp.RED, value: '炮2平5' }, { camp: Camp.BLACK, value: '马八进七' },
      { camp: Camp.RED, value: '马2进3' }, { camp: Camp.BLACK, value: '车九平八' },
      { camp: Camp.RED, value: '车1平2' }, { camp: Camp.BLACK, value: '马二进三' },
      { camp: Camp.RED, value: '兵7进1' }, { camp: Camp.BLACK, value: '卒七进一' },
      { camp: Camp.RED, value: '车2进4' }, { camp: Camp.BLACK, value: '炮八平九' },
      { camp: Camp.RED, value: '车2平4' }, { camp: Camp.BLACK, value: '车八进六' },
      { camp: Camp.RED, value: '兵3进1' }, { camp: Camp.BLACK, value: '车八平七' },
      { camp: Camp.RED, value: '兵3进1' }, { camp: Camp.BLACK, value: '车七退二' },
      { camp: Camp.RED, value: '炮8平6' }, { camp: Camp.BLACK, value: '车一进一' },
      { camp: Camp.RED, value: '马8进7' }, { camp: Camp.BLACK, value: '车一平四' },
      { camp: Camp.RED, value: '马7进6' }, { camp: Camp.BLACK, value: '车四平八' },
      { camp: Camp.RED, value: '车9平8' }, { camp: Camp.BLACK, value: '炮二平一' },
      { camp: Camp.RED, value: '马6进7' }, { camp: Camp.BLACK, value: '炮一进四' },
      { camp: Camp.RED, value: '车8进3' }, { camp: Camp.BLACK, value: '炮一退二' },
      { camp: Camp.RED, value: '车8平7' }, { camp: Camp.BLACK, value: '马七进八' },
      { camp: Camp.RED, value: '马3进2' }, { camp: Camp.BLACK, value: '炮九进四' },
      { camp: Camp.RED, value: '兵5进1' }, { camp: Camp.BLACK, value: '炮九进三' },
      { camp: Camp.RED, value: '炮5平3' }, { camp: Camp.BLACK, value: '车七平四' },
      { camp: Camp.RED, value: '仕6进5' }, { camp: Camp.BLACK, value: '马八进六' },
      { camp: Camp.RED, value: '车7平4' }, { camp: Camp.BLACK, value: '车八进四' },
      { camp: Camp.RED, value: '炮3平4' }, { camp: Camp.BLACK, value: '马六进八' },
      { camp: Camp.RED, value: '车4平3' }, { camp: Camp.BLACK, value: '炮一进五' },
      { camp: Camp.RED, value: '相7进5' }, { camp: Camp.BLACK, value: '车四平二' },
      { camp: Camp.RED, value: '兵7进1' }
    ]

    const newValue = generateChessPiecesByManual(source.slice(0, -1))
    expect(newValue.currentCamp).toBeTruthy()
    expect(newValue.firstCamp).toBeTruthy()
    expect(Array.isArray(newValue.chessPieces)).toBeTruthy()
  })

  describe('转换棋局', () => {
    manuals.forEach(manual => {
      test('理应转换', () => {
        const newValue = generateChessPiecesByManual(manual as unknown as ChessManual[])
        expect(newValue.currentCamp).toBeTruthy()
        expect(newValue.firstCamp).toBeTruthy()
        expect(Array.isArray(newValue.chessPieces)).toBeTruthy()
      })
    })
  })
})
