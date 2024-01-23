import ChessPiece from '../libs/ChessPiece'
import Point from '../libs/Point'
import { GameContext, UserLike } from './helper'

export type ClientEvents = {
  mounted: unknown
  destroyed: unknown

  'animation:finished': 'check' | 'check-mate' | 'win'
}

export type ServeEvents = {
  'piece:kill': { piece: ChessPiece, targetPiece: ChessPiece }
  'piece:move': { piece: ChessPiece, targetPoint: Point }
  'piece:select': { context: GameContext, user?: UserLike }
  'piece:select:cancel': { context: GameContext, user?: UserLike }
  'context:change': { context: GameContext, user?: UserLike }

  'game:start': GameContext
  'game:restart': unknown
  'game:over': GameContext
  'game:pause': unknown
  'game:undo': GameContext
  'game:give:up': GameContext
  'game:reset': GameContext
  'game:error': { context: GameContext, user?: UserLike }

  'player:leave': UserLike
  'player:join': UserLike
  'player:switch:camp': unknown
  'player:ready': UserLike
  'player:cancel:ready': UserLike
}
