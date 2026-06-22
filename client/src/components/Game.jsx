import React from 'react';
import Board from './Board';

function Game({
  roomId,
  playerSymbol,
  playerNames,
  board,
  turn,
  gameOver,
  winner,
  winnerName,
  winLine,
  draw,
  opponentLeft,
  onMakeMove,
  onRestart,
  onLeave,
}) {
  const safeBoard = board || Array(9).fill(null);
  const isMyTurn = turn === playerSymbol && !gameOver && !opponentLeft;

  let statusText = '';
  let statusClass = '';

  if (opponentLeft) {
    statusText = '👋 Opponent left the game';
    statusClass = 'error';
  } else if (gameOver) {
    if (draw) {
      statusText = '🤝 It\'s a draw!';
      statusClass = 'draw';
    } else if (winner && winnerName) {
      statusText = (
        <>
          <span className="winner-name">{winnerName}</span>
          <span className="winner-text"> wins! 🎉</span>
        </>
      );
      statusClass = 'winner';
    } else {
      statusText = 'Game Over';
    }
  } else {
    const currentPlayerName = turn === 'X' ? playerNames?.X : playerNames?.O;
    statusText = (
      <>
        <span className={`symbol ${turn?.toLowerCase() || ''}`}>{turn || '?'}</span>
        <span>{` ${currentPlayerName || 'Player'}'s turn`}</span>
        {playerSymbol && <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>(You are {playerSymbol})</span>}
      </>
    );
    statusClass = 'turn';
  }

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId);
    alert('Room code copied!');
  };

  // Disable board if opponent left
  const boardDisabled = gameOver || opponentLeft || !isMyTurn;

  return (
    <div className="game">
      <div className="room-info">
        <span>Room:</span>
        <span className="room-code">{roomId || '---'}</span>
        <button onClick={copyRoomCode} title="Copy code">📋</button>
      </div>

      <div className={`game-status ${statusClass}`}>
        {statusText}
      </div>

      <Board
        squares={safeBoard}
        winLine={winLine}
        onSquareClick={onMakeMove}
        disabled={boardDisabled}
      />

      <div className="game-actions">
        <button className="btn-leave" onClick={onLeave}>🚪 Leave</button>
        <button 
          className="btn-restart" 
          onClick={onRestart} 
          disabled={opponentLeft}
        >
          {opponentLeft ? '⏳ Opponent left' : '🔄 New Game'}
        </button>
      </div>
    </div>
  );
}

export default Game;