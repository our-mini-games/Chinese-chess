import { loadResources } from './client'
import ChessPiece from './libs/ChessPiece'
import { createGameInterface } from './libs/GameInterface'
import Point from './libs/Point'

const gi = createGameInterface({})
const oApp = document.querySelector<HTMLElement>('#app')!
gi.mount(oApp)
// gi.setRotate(Math.PI)

// const piece = new ChessPiece(11)

loadResources()
  .then((res) => {
    gi.setResource(res)
    // gi.drawChessPieces([piece])
    // gi.drawCurrentStop(piece.coord, piece.camp)
    // gi.drawLastStop(new Point(1, 1), piece.camp)

    // gi.animations.blackWin.run()
  })
