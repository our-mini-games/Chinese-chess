import pkg from '../package.json'
import ChessPiece from './libs/ChessPiece'

export * from './libs/GameInterface'
export * from './definitions'
export * from './helper'
export type { ClientEvents } from './types/emitter'
export type { MockMoveResult, ChessManual, UserLike, Players, GameContext } from './types/helper'
export { Camp, GameStatus } from './definitions'
// export { loadResources } from './libs/Resource'
export { createServer } from './server'

export { ChessPiece }

export const __VERSION__ = pkg.version
