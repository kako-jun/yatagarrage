import Phaser from 'phaser'
import { useEffect, useState } from 'react'
import './App.css'
import PhaserGame from './components/PhaserGame'
import { DANMAKU_PATTERNS } from './game/patterns'

function App() {
  type Mode = 'menu' | 'game' | 'debug'

  const [mode, setMode] = useState<Mode>('menu')
  const [gameInstance, setGameInstance] = useState<Phaser.Game | null>(null)
  const [debugGravitySourceCount, setDebugGravitySourceCount] = useState(3)
  const [gravityStrengths, setGravityStrengths] = useState([
    1600000, 1200000, 900000,
  ])

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

  const setGravitySourceCount = (count: number) => {
    if (mode !== 'debug') return
    setDebugGravitySourceCount(count)
    if (gameInstance) {
      gameInstance.events.emit('debug-set-gravity-count', count)
    }
  }

  const setGravityStrength = (index: number, strength: number) => {
    if (mode !== 'debug') return
    const newStrengths = [...gravityStrengths]
    newStrengths[index] = strength
    setGravityStrengths(newStrengths)
    if (gameInstance) {
      gameInstance.events.emit('debug-set-gravity-strength', index, strength)
    }
  }

  useEffect(() => {
    if (mode === 'debug' && gameInstance) {
      gameInstance.events.emit(
        'debug-set-gravity-count',
        debugGravitySourceCount
      )
      gravityStrengths.forEach((strength, index) => {
        gameInstance.events.emit('debug-set-gravity-strength', index, strength)
      })
    }
  }, [mode, gameInstance, debugGravitySourceCount, gravityStrengths])

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
                </div>

                <div className="gravity-controls">
                  <div className="gravity-count">
                    <label>重力源の個数:</label>
                    <div className="gravity-count-buttons">
                      {[0, 1, 2, 3].map(count => (
                        <button
                          key={count}
                          onClick={() => setGravitySourceCount(count)}
                          className={
                            debugGravitySourceCount === count ? 'active' : ''
                          }
                        >
                          {count}個
                        </button>
                      ))}
                    </div>
                  </div>

                  {[0, 1, 2].map(
                    index =>
                      index < debugGravitySourceCount && (
                        <div key={index} className="gravity-strength">
                          <label>
                            重力源{index + 1}の強さ:{' '}
                            {(gravityStrengths[index] / 1000000).toFixed(1)}M
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="3000000"
                            step="100000"
                            value={gravityStrengths[index]}
                            onChange={e =>
                              setGravityStrength(
                                index,
                                parseInt(e.target.value)
                              )
                            }
                          />
                        </div>
                      )
                  )}
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
