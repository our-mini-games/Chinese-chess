import { Camp, GameStatus } from '../definitions'
import ChessPiece from '../libs/ChessPiece'
import Point from '../libs/Point'

export type MockMoveResult = 'not-allow' | 'check' | 'allow'

export interface ChessManual {
  camp: Camp
  value: string
}

export interface UserLike extends Record<any, any> {
  id: string | number
  isReady: boolean
  firstCamp: Camp
}

export interface Players {
  [Camp.RED]?: UserLike
  [Camp.BLACK]?: UserLike
}

export interface GameContext {
  status: GameStatus
  players: null | Players
  firstCamp: Camp
  // waiting: number
  currentCamp: Camp
  manual: ChessManual[]
  chessPieces: ChessPiece[]

  /** 动画计时器 */
  counter: number
  /** 收集移动路径，生成棋谱 */
  movePath: any[]
  /** 当前活跃棋子，当前阵营用户选中的已方棋子 */
  activePiece: null | ChessPiece
  /** 当前活跃棋子的可移动坐标 */
  allowPoints: Point[]

  message: any[]
}
