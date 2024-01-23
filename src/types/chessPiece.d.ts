import { Camp } from '../definitions'
import ChessPiece from '../libs/ChessPiece'
import Point from '../libs/Point'

export type ChessPieceValue =
  | 11 | 12 | 13 | 14 | 15 | 16 | 17
  | 21 | 22 | 23 | 24 | 25 | 26 | 27

export interface ChessPieceMapItem {
  coords: Point[]
  name: string
  camp: Camp
}

export interface NearestPieces {
  top?: ChessPiece
  right?: ChessPiece
  bottom?: ChessPiece
  left?: ChessPiece
}
