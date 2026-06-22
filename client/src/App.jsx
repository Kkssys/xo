import React, { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import Lobby from './components/Lobby';
import Game from './components/Game';
import WinCelebration from './components/WinCelebration';

const SOCKET_URL = '/';  // uses Vite proxy

function App() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState(null);
  const [playerSymbol, setPlayerSymbol] = useState(null);
  const [playerNames, setPlayerNames] = useState({ X: null, O: null });
  const [gameState, setGameState] = useState({
    board: Array(9).fill(null),
    turn: 'X',
    gameOver: false,
    winner: null,
    winnerName: null,
    winLine: null,
    draw: false,
  });
  const [opponentLeft, setOpponentLeft] = useState(false);
  const [error, setError] = useState(null);
  const [showWinCelebration, setShowWinCelebration] = useState(false);

  // ---- Socket connection ----
  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to server');
      setIsConnected(true);
      setError(null);
    });

    newSocket.on('disconnect', (reason) => {
      console.log(`❌ Disconnected: ${reason}`);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Connection error:', err);
      setError('Could not connect to server. Make sure it’s running on port 3001.');
    });

    setSocket(newSocket);
    return () => newSocket.close();
  }, []);

  // ---- Socket event handlers ----
  useEffect(() => {
    if (!socket) return;

    const onRoomCreated = ({ roomId, symbol, playerNames }) => {
      console.log('📦 Room created:', roomId, symbol, playerNames);
      setRoomId(roomId);
      setPlayerSymbol(symbol);
      setPlayerNames(playerNames);
      setGameState({
        board: Array(9).fill(null),
        turn: 'X',
        gameOver: false,
        winner: null,
        winnerName: null,
        winLine: null,
        draw: false,
      });
      setOpponentLeft(false);
      setShowWinCelebration(false);
    };

    const onRoomJoined = ({ roomId, symbol, playerNames }) => {
      console.log('📦 Room joined:', roomId, symbol, playerNames);
      setRoomId(roomId);
      setPlayerSymbol(symbol);
      setPlayerNames(playerNames);
      setShowWinCelebration(false);
    };

    const onJoinError = (msg) => alert('❌ ' + msg);

    const onGameStart = ({ board, turn, playerNames }) => {
      console.log('🎮 Game start');
      setPlayerNames(playerNames);
      setGameState(prev => ({
        ...prev,
        board,
        turn,
        gameOver: false,
        winner: null,
        winnerName: null,
        winLine: null,
        draw: false,
      }));
      setOpponentLeft(false);
      setShowWinCelebration(false);
    };

    const onMoveMade = ({ board, turn }) => {
      setGameState(prev => ({ ...prev, board, turn }));
    };

    const onGameOver = ({ board, winner, winnerName, winLine, draw }) => {
      console.log('🏁 Game over:', winner, winnerName);
      setGameState(prev => ({
        ...prev,
        board,
        gameOver: true,
        winner,
        winnerName,
        winLine,
        draw,
      }));
      if (winnerName && !draw) {
        setShowWinCelebration(true);
      }
    };

    const onGameRestarted = ({ board, turn }) => {
      console.log('🔄 Game restarted');
      setGameState(prev => ({
        ...prev,
        board,
        turn,
        gameOver: false,
        winner: null,
        winnerName: null,
        winLine: null,
        draw: false,
      }));
      setOpponentLeft(false);
      setShowWinCelebration(false);
    };

    const onOpponentLeft = () => {
      console.log('👋 Opponent left');
      setOpponentLeft(true);
      setShowWinCelebration(false);
    };

    socket.on('roomCreated', onRoomCreated);
    socket.on('roomJoined', onRoomJoined);
    socket.on('joinError', onJoinError);
    socket.on('gameStart', onGameStart);
    socket.on('moveMade', onMoveMade);
    socket.on('gameOver', onGameOver);
    socket.on('gameRestarted', onGameRestarted);
    socket.on('opponentLeft', onOpponentLeft);

    return () => {
      socket.off('roomCreated', onRoomCreated);
      socket.off('roomJoined', onRoomJoined);
      socket.off('joinError', onJoinError);
      socket.off('gameStart', onGameStart);
      socket.off('moveMade', onMoveMade);
      socket.off('gameOver', onGameOver);
      socket.off('gameRestarted', onGameRestarted);
      socket.off('opponentLeft', onOpponentLeft);
    };
  }, [socket]);

  // ---- Actions ----
  const createRoom = useCallback(() => {
    if (!socket || !isConnected) {
      alert('Not connected to server.');
      return;
    }
    if (!playerName.trim()) {
      alert('Please enter your name.');
      return;
    }
    socket.emit('createRoom', { playerName: playerName.trim() });
  }, [socket, isConnected, playerName]);

  const joinRoom = useCallback((roomId) => {
    if (!socket || !isConnected) {
      alert('Not connected to server.');
      return;
    }
    if (!playerName.trim()) {
      alert('Please enter your name.');
      return;
    }
    socket.emit('joinRoom', { roomId, playerName: playerName.trim() });
  }, [socket, isConnected, playerName]);

  const makeMove = useCallback((index) => {
    if (socket && roomId && !gameState.gameOver && gameState.turn === playerSymbol) {
      socket.emit('makeMove', { roomId, index });
    }
  }, [socket, roomId, gameState.gameOver, gameState.turn, playerSymbol]);

  const restartGame = useCallback(() => {
    if (socket && roomId && !opponentLeft) {
      socket.emit('restartGame', { roomId });
    }
  }, [socket, roomId, opponentLeft]);

  // ---- Leave: reset UI immediately, also send leave event ----
  const leaveRoom = useCallback(() => {
    if (socket && roomId) {
      socket.emit('leaveRoom', { roomId });
    }
    // Reset UI regardless of server response
    setRoomId(null);
    setPlayerSymbol(null);
    setPlayerNames({ X: null, O: null });
    setGameState({
      board: Array(9).fill(null),
      turn: 'X',
      gameOver: false,
      winner: null,
      winnerName: null,
      winLine: null,
      draw: false,
    });
    setOpponentLeft(false);
    setShowWinCelebration(false);
  }, [socket, roomId]);

  const handleCloseCelebration = () => {
    setShowWinCelebration(false);
  };

  return (
    <div className="app">
      <h1 className="app-title"> ✖️ ⭕</h1>
      {error && <div className="lobby-status error">{error}</div>}
      {!isConnected && !error && <div className="lobby-status">⏳ Connecting to server...</div>}

      {!roomId ? (
        <Lobby
          playerName={playerName}
          setPlayerName={setPlayerName}
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          isConnected={isConnected}
        />
      ) : (
        <Game
          roomId={roomId}
          playerSymbol={playerSymbol}
          playerNames={playerNames}
          board={gameState.board}
          turn={gameState.turn}
          gameOver={gameState.gameOver}
          winner={gameState.winner}
          winnerName={gameState.winnerName}
          winLine={gameState.winLine}
          draw={gameState.draw}
          opponentLeft={opponentLeft}
          onMakeMove={makeMove}
          onRestart={restartGame}
          onLeave={leaveRoom}
        />
      )}

      {showWinCelebration && (
        <WinCelebration
          winnerName={gameState.winnerName}
          onClose={handleCloseCelebration}
        />
      )}
    </div>
  );
}

export default App;