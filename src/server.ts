import { Camp, GameStatus } from './definitions'
import { createContext, generateChessPiecesByManual, getAllowPoints, getFirstCamp, getPieceByPoint, isCheckMate, isSameCoord, mockMove, recordManual, switchCamp } from './helper'
import ChessPiece from './libs/ChessPiece'
import Point from './libs/Point'
import { ServeEvents } from './types/emitter'
import { MockMoveResult, UserLike } from './types/helper'
import mitt from 'mitt'

export const createServer = () => {
  const emitter = mitt<ServeEvents>()
  let context = createContext()

  const isAllReady = () => context.players?.[Camp.RED]?.isReady && context.players?.[Camp.BLACK]?.isReady
  const isCurrentCampPlayer = (user: UserLike) => context.players?.[context.currentCamp]?.id === user.id

  const getUserCamp = (user: UserLike) => {
    return context.players?.[Camp.RED]?.id === user.id
      ? Camp.RED
      : context.players?.[Camp.BLACK]?.id === user.id
        ? Camp.BLACK
        : null
  }

  const movePiece = (point: Point, mockMoveResult?: MockMoveResult) => {
    const { activePiece, chessPieces } = context

    const piece = getPieceByPoint(point, chessPieces)
    if (piece) {
      // 击杀位置所在敌方棋子
      context.chessPieces = chessPieces.filter(p => p !== piece)

      emitter.emit('piece:kill', { piece: activePiece!, targetPiece: piece })
    }

    // 打棋谱
    context.manual.push(recordManual(activePiece!, point, chessPieces))
    // 记录移动轨迹
    context.movePath = [
      context.activePiece!.coord,
      point
    ]

    // 移动到新位置
    ChessPiece.move(activePiece!, point)

    emitter.emit('piece:move', { piece: activePiece!, targetPoint: point })

    context.message = mockMoveResult === 'check'
      ? [{
          type: 'animation',
          content: 'check'
        }]
      : []

    const isGG = isCheckMate(context.currentCamp, chessPieces)
    if (isGG) {
      context.message.push({
        type: 'animation',
        content: 'checkMate'
      }, {
        type: 'animation',
        content: context.currentCamp === Camp.BLACK ? 'blackWin' : 'redWin'
      })
      context.status = GameStatus.Finished

      context.players![Camp.RED]!.isReady = false
      context.players![Camp.BLACK]!.isReady = false

      context.allowPoints = []

      emitter.emit('game:over', context)
      return
    }
    Object.assign(context, {
      // 更换阵营
      currentCamp: isGG ? context.currentCamp : switchCamp(context.currentCamp),
      // 清空提示点
      allowPoints: [],
      // 移除活跃棋子
      activePiece: null
    })

    emitter.emit('context:change', { context })
  }

  const join = (user: UserLike): boolean => {
    if (context.players?.[Camp.RED] && context.players?.[Camp.BLACK]) {
      return false
    }

    if (!context.players?.[Camp.RED]) {
      context.players = {
        [Camp.RED]: user
      }
    } else {
      context.players[Camp.BLACK] = user
    }

    emitter.emit('player:join', user)

    // 游戏结束，重新进人
    if (context.status !== GameStatus.Init) {
      Object.assign(context, createContext(), {
        status: GameStatus.Init,
        players: context.players,
        firstCamp: Camp.RED,
        currentCamp: Camp.RED
      })
    }
    emitter.emit('context:change', { context })

    return true
  }

  const leave = (user: UserLike) => {
    if (context.players?.[Camp.BLACK]?.id === user.id) {
      context.players[Camp.BLACK] = undefined
    } else if (context.players?.[Camp.RED]?.id === user.id) {
      context.players[Camp.RED] = undefined
    }

    emitter.emit('player:leave', user)

    if (!context.players?.[Camp.BLACK] && !context.players?.[Camp.RED]) {
      // 对战用户已离开，重启游戏
      context = createContext()

      emitter.emit('game:over', context)
    } else if (context.players?.[Camp.BLACK] || context.players?.[Camp.RED]) {
      // 对手已跳车，重启
      context = createContext(context.players)
      emitter.emit('game:reset', context)
    }
  }

  const readyOrCancelReady = (user: UserLike, isReady: boolean, firstCamp: Camp = Camp.RED) => {
    if (context.players?.[Camp.BLACK]?.id === user.id) {
      context.players[Camp.BLACK].isReady = isReady
      context.players[Camp.BLACK].firstCamp = firstCamp

      emitter.emit(isReady ? 'player:ready' : 'player:cancel:ready', user)
    } else if (context.players?.[Camp.RED]?.id === user.id) {
      context.players[Camp.RED].isReady = isReady
      context.players[Camp.RED].firstCamp = firstCamp

      emitter.emit(isReady ? 'player:ready' : 'player:cancel:ready', user)
    }

    emitter.emit('context:change', { context })
  }

  const exchangePlayersCamp = () => {
    if (
      (context.status !== GameStatus.Init && context.status !== GameStatus.Finished) ||
      !context.players
    ) {
      return
    }

    [context.players[Camp.RED], context.players[Camp.BLACK]] = [context.players[Camp.BLACK], context.players[Camp.RED]]
    context.message = [{
      type: 'tips',
      content: '双方交换阵营'
    }]

    emitter.emit('player:switch:camp', context)
  }

  const undo = (camp: Camp) => {
    if (
      context.status !== GameStatus.Playing ||
      !context.players
    ) {
      return
    }

    const last = context.manual.at(-1)
    if (!last) {
      return
    }

    // 由于存在网络延迟问题
    // 悔棋时可能会存在对方已经多走了一步
    // 所以需要把棋局退回到对方上一次的位置
    const manual = last.camp === camp
      ? context.manual.slice(0, -1)
      : context.manual.slice(0, -2)

    Object.assign(context, {
      ...context,
      ...generateChessPiecesByManual(manual),
      manual,
      currentCamp: switchCamp(context.currentCamp),
      activePiece: null,
      allowPoints: [],
      movePath: [],
      message: []
    })
    emitter.emit('game:undo', context)
  }

  const start = () => {
    if (!isAllReady()) {
      return false
    }

    const firstCamp = getFirstCamp(context.players!)

    Object.assign(context, {
      status: GameStatus.Playing,
      firstCamp,
      currentCamp: firstCamp
    })
    emitter.emit('game:start', context)

    return true
  }

  const restart = () => {
    if (!isAllReady()) {
      return false
    }

    const firstCamp = getFirstCamp(context.players!)

    Object.assign(context, createContext(), {
      status: GameStatus.Playing,
      players: context.players,
      firstCamp,
      currentCamp: firstCamp
    })
    emitter.emit('game:start', context)

    return true
  }

  const pauseOrPlay = (isPause = true) => {
    context.status = isPause ? GameStatus.Paused : GameStatus.Playing
    emitter.emit('game:pause')
    emitter.emit('context:change', { context })
  }

  const moveOrSelect = (user: UserLike, point: Point) => {
    if (!isCurrentCampPlayer(user)) {
      context.message = [{
        type: 'tips',
        content: '非当前阵营用户操作'
      }]
      emitter.emit('game:error', { context, user })
      return false
    }

    const piece = getPieceByPoint(point, context.chessPieces)
    if (!context.activePiece) {
      if (!piece) {
        context.message = [{
          type: 'tips',
          content: '无法选择空区域'
        }]
        emitter.emit('game:error', { context, user })
        return false
      }

      if (context.currentCamp !== piece?.camp) {
        context.message = [{
          type: 'tips',
          content: '无法选择对方的棋子'
        }]
        emitter.emit('game:error', { context, user })
        return false
      }

      // 选中
      context.activePiece = piece
      context.allowPoints = getAllowPoints(piece, context.chessPieces)
      context.message = []
      context.movePath = []
      emitter.emit('piece:select', { context, user })
      return true
    }

    if (context.currentCamp === piece?.camp) {
      // 选中了己方棋子
      context.message = []
      if (isSameCoord(context.activePiece.coord, piece.coord)) {
        // 选中了同一个棋子，取消选中
        context.activePiece = null
        context.allowPoints = []
        emitter.emit('piece:select:cancel', { context, user })
      } else {
        // 更新选中
        context.activePiece = piece
        context.allowPoints = getAllowPoints(piece, context.chessPieces)
        emitter.emit('piece:select', { context, user })
      }
      return true
    }

    // 移动
    if (!context.allowPoints.find(p => isSameCoord(p, point))) {
      context.message = [{
        type: 'tips',
        content: '当前位置无法移动'
      }]
      context.activePiece = null
      context.allowPoints = []
      emitter.emit('game:error', { context, user })
      return false
    }

    const mockMoveResult = mockMove(context.activePiece, point, context.chessPieces)

    switch (mockMoveResult) {
      case 'allow':
        movePiece(point, mockMoveResult)
        return true
      case 'not-allow':
        context.message = [{
          type: 'tips',
          content: '当前位置无法移动'
        }]
        context.activePiece = null
        context.allowPoints = []
        emitter.emit('game:error', { context, user })
        return false
      case 'check':
        movePiece(point, mockMoveResult)
        return true
      default:
        return false
    }
  }

  const giveUp = (user: UserLike) => {
    if (context.status !== GameStatus.Playing) {
      return
    }

    const camp = getUserCamp(user)
    if (camp) {
      context.players![Camp.RED]!.isReady = false
      context.players![Camp.BLACK]!.isReady = false

      Object.assign(context, {
        status: GameStatus.Finished,
        message: [{
          type: 'tips',
          content: `用户「${context.players![camp]!.nickname}」投降了`
        }],
        // 清空提示点
        allowPoints: [],
        // 移除活跃棋子
        activePiece: null
      })

      emitter.emit('game:give:up', context)
    }
  }

  const reset = () => {
    context = createContext()
    emitter.all.clear()
    emitter.emit('context:change', { context })
  }

  return {
    get context () {
      return context
    },

    on: emitter.on,

    join,
    leave,
    readyOrCancelReady,
    exchangePlayersCamp,

    start,
    restart,
    pauseOrPlay,

    moveOrSelect,
    undo,
    giveUp,

    reset
  }
}
