import { useState } from 'react'
import './App.css'
import PhaserGame from './components/PhaserGame'

function App() {
  const [gameStarted, setGameStarted] = useState(false)

  return (
    <div className="App">
      <header className="App-header">
        <h1>シューティングゲーム - React + Vite + TypeScript</h1>
      </header>

      {!gameStarted ? (
        <div className="start-screen">
          <p>
            操作方法：
            <br />
            画面上半分タップ: 射撃
            <br />
            画面下半分タップ: 移動
            <br />
            敵の弾幕は重力の影響を受けます！
          </p>
          <button onClick={() => setGameStarted(true)}>ゲームを開始</button>
        </div>
      ) : (
        <PhaserGame />
      )}
    </div>
  )
}

export default App
