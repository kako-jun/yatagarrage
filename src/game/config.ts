import Phaser from 'phaser'
import { DebugScene } from './DebugScene'
import { MainScene } from './MainScene'

type Mode = 'game' | 'debug'

export const createGameConfig = (
  mode: Mode = 'game'
): Phaser.Types.Core.GameConfig => ({
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'phaser-game',
  backgroundColor: '#000000',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: mode === 'debug',
    },
  },
  scene: mode === 'debug' ? [DebugScene] : [MainScene],
})
