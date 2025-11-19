import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { createGameConfig } from '../game/config'
import './PhaserGame.css'

type Props = {
  mode?: 'game' | 'debug'
  onGameInstanceChanged?: (game: Phaser.Game | null) => void
}

function PhaserGame({ mode = 'game', onGameInstanceChanged }: Props) {
  const gameRef = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    if (!gameRef.current) {
      gameRef.current = new Phaser.Game(createGameConfig(mode))
      onGameInstanceChanged?.(gameRef.current)
    }

    return () => {
      if (gameRef.current) {
        onGameInstanceChanged?.(null)
        gameRef.current.destroy(true)
        gameRef.current = null
      }
    }
  }, [mode, onGameInstanceChanged])

  return (
    <div className="phaser-game-container">
      <div id="phaser-game"></div>
    </div>
  )
}

export default PhaserGame
