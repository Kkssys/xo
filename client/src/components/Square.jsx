import React from 'react';

function Square({ value, onClick, disabled, isWin }) {
  let className = 'square';
  if (value) className += ` ${value.toLowerCase()}`;
  if (disabled) className += ' disabled';
  if (isWin) className += ' win';

  return (
    <button className={className} onClick={onClick} disabled={disabled}>
      {value}
    </button>
  );
}

export default Square;