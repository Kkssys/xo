import React from 'react';
import Square from './Square';

function Board({ squares, winLine, onSquareClick, disabled }) {
  const renderSquare = (i) => {
    const isWin = winLine && winLine.includes(i);
    return (
      <Square
        key={i}
        value={squares[i]}
        onClick={() => onSquareClick(i)}
        disabled={disabled || squares[i] !== null}
        isWin={isWin}
      />
    );
  };

  return (
    <div className="board">
      {Array(9).fill(null).map((_, i) => renderSquare(i))}
    </div>
  );
}

export default Board;