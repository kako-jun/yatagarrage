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
            矢印キー: 移動
            <br />
            スペースキー: 弾を発射
            <br />
            タップでも操作できます
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
