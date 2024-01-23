import { Camp, chessPieceMapper } from '../definitions'
import type { ChessPieceValue } from '../types/chessPiece'
import Point from './Point'

export default class ChessPiece {
  name: string
  camp: Camp
  coord: Point

  constructor (public value: ChessPieceValue, coordIndex = 0) {
    const piece = chessPieceMapper[value]

    this.coord = piece.coords[coordIndex]
    this.camp = piece.camp
    this.name = piece.name
  }

  static move<T extends ChessPiece = ChessPiece> (chessPiece: T, p: Point): T
  // eslint-disable-next-line no-dupe-class-members
  static move<T extends ChessPiece = ChessPiece> (chessPiece: T, x: number, y: number): T
  // eslint-disable-next-line no-dupe-class-members
  static move<T extends ChessPiece = ChessPiece> (chessPiece: T, pointOrX: Point | number, y?: number): T {
    if (typeof pointOrX === 'number') {
      chessPiece.coord = new Point(pointOrX, y)
    } else {
      chessPiece.coord = pointOrX
    }

    return chessPiece
  }
}
