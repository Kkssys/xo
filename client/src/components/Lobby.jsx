import React, { useState } from 'react';

function Lobby({ playerName, setPlayerName, onCreateRoom, onJoinRoom, isConnected }) {
  const [roomInput, setRoomInput] = useState('');

  const handleJoin = (e) => {
    e.preventDefault();
    if (roomInput.trim().length === 0) return;
    onJoinRoom(roomInput.trim().toUpperCase());
  };

  return (
    <div className="lobby">
      <div className="name-input">
        <input
          type="text"
          placeholder="Enter your name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          maxLength={20}
          className="name-field"
        />
      </div>
      <div className="lobby-actions">
        <button 
          className="btn-primary" 
          onClick={onCreateRoom} 
          disabled={!playerName.trim() || !isConnected}
        >
           Create New Game 
        </button>
        <div className="lobby-divider"> —————— or join with code ——————</div>
        <form className="join-form" onSubmit={handleJoin}>
          <input
            type="text"
            placeholder="Enter Room Code"
            value={roomInput}
            onChange={(e) => setRoomInput(e.target.value)}
            maxLength={6}
          />
          <button type="submit" disabled={!playerName.trim() || !isConnected}>
            Join
          </button>
        </form>
      </div>
      {!playerName.trim() && (
        <div className="lobby-status">Please enter your name to continue</div>
      )}
      {!isConnected && playerName.trim() && (
        <div className="lobby-status error">⚠️ Not connected to server</div>
      )}
    </div>
  );
}

export default Lobby;