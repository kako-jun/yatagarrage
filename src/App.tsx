import Phaser from 'phaser'
import { useEffect, useState } from 'react'
import './App.css'
import PhaserGame from './components/PhaserGame'
import { DANMAKU_PATTERNS } from './game/patterns'

function App() {
  type Mode = 'menu' | 'game' | 'debug'

  const [mode, setMode] = useState<Mode>('menu')
  const [gameInstance, setGameInstance] = useState<Phaser.Game | null>(null)
  const [debugGravityEnabled, setDebugGravityEnabled] = useState(true)

  const startGame = () => setMode('game')
  const startDebug = () => setMode('debug')
  const backToMenu = () => setMode('menu')

  const triggerPattern = (patternId: string) => {
    if (mode !== 'debug') return
    gameInstance?.events.emit('debug-fire-pattern', patternId)
  }

  const clearDebugBullets = () => {
    if (mode !== 'debug') return
    gameInstance?.events.emit('debug-clear')
  }

  const toggleDebugGravity = () => {
    if (mode !== 'debug') return
    const next = !debugGravityEnabled
    setDebugGravityEnabled(next)
    if (gameInstance) {
      gameInstance.registry.set('debug-gravity-enabled', next)
      gameInstance.events.emit('debug-set-gravity', next)
    }
  }

  useEffect(() => {
    if (mode === 'debug' && gameInstance) {
      gameInstance.registry.set('debug-gravity-enabled', debugGravityEnabled)
      gameInstance.events.emit('debug-set-gravity', debugGravityEnabled)
    }
  }, [mode, gameInstance, debugGravityEnabled])

  return (
    <div className="App">
      <header className="App-header">
        <h1>シューティングゲーム - React + Vite + TypeScript</h1>
      </header>

      {mode === 'menu' ? (
        <div className="start-screen">
          <p>
            操作方法：
            <br />
            画面外周タップ: 射撃
            <br />
            中央部分タップ: 移動
            <br />
            敵の弾幕は重力の影響を受けます！
          </p>
          <div className="start-buttons">
            <button onClick={startGame}>ゲームを開始</button>
            <button className="secondary" onClick={startDebug}>
              デバッグモード
            </button>
          </div>
          <p className="debug-note">
            デバッグモードでは弾幕IDのボタンが並び、押すたびに即座に画面へ表示して挙動を確認できます。
            <br />
            重力源のON/OFFボタンも用意しているので、本編同様の環境を即チェックできます。
          </p>
        </div>
      ) : (
        <div className="game-wrapper">
          <div className="toolbar">
            <button className="secondary" onClick={backToMenu}>
              メニューに戻る
            </button>

            {mode === 'debug' && (
              <div className="debug-toolbar">
                <div className="debug-actions">
                  <button onClick={clearDebugBullets}>弾をクリア</button>
                  <button onClick={toggleDebugGravity}>
                    {debugGravityEnabled ? '重力源OFF' : '重力源ON'}
                  </button>
                </div>
                <div className="pattern-buttons">
                  {DANMAKU_PATTERNS.map(pattern => (
                    <button
                      key={pattern.id}
                      onClick={() => triggerPattern(pattern.id)}
                      title={pattern.description}
                    >
                      {pattern.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <PhaserGame
            mode={mode === 'debug' ? 'debug' : 'game'}
            onGameInstanceChanged={setGameInstance}
          />
        </div>
      )}
    </div>
  )
}

export default App
