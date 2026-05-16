import { Application } from 'pixi.js'
import { COLORS } from './constants/colors'
import { DebugScene } from './scenes/DebugScene'
import { GameScene } from './scenes/GameScene'
import { GameOverScene } from './scenes/GameOverScene'
import { SceneManager } from './scenes/SceneManager'
import { TitleScene } from './scenes/TitleScene'
import { createInitialGameState, VIEW_HEIGHT, VIEW_WIDTH } from './types/GameState'

async function bootstrap(): Promise<void> {
  const root = document.getElementById('root')
  if (root === null) {
    throw new Error('#root が見つからない')
  }

  const app = new Application()
  await app.init({
    width: VIEW_WIDTH,
    height: VIEW_HEIGHT,
    background: COLORS.background,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    antialias: true,
  })
  root.appendChild(app.canvas)

  const sceneManager = new SceneManager()
  app.stage.addChild(sceneManager.world)

  const gameScene = new GameScene()
  const debugScene = new DebugScene()

  const gameOverScene = new GameOverScene(() => {
    gameScene.initWithState(createInitialGameState())
    sceneManager.show('game')
  })

  const titleScene = new TitleScene(
    () => {
      gameScene.initWithState(createInitialGameState())
      sceneManager.show('game')
    },
    () => {
      debugScene.reset()
      sceneManager.show('debug')
    }
  )

  debugScene.onBack = () => sceneManager.show('title')

  gameScene.onGameOver = score => {
    gameOverScene.setScore(score)
    sceneManager.show('gameover')
  }

  sceneManager.registerScene('title', titleScene)
  sceneManager.registerScene('game', gameScene)
  sceneManager.registerScene('gameover', gameOverScene)
  sceneManager.registerScene('debug', debugScene)
  sceneManager.show('title')

  app.ticker.add(ticker => {
    if (sceneManager.current === 'game') {
      gameScene.update(ticker)
    } else if (sceneManager.current === 'debug') {
      debugScene.update(ticker)
    }
  })
}

void bootstrap()
