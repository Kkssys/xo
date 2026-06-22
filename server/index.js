import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Room structure:
// {
//   players: { X: { id, name }, O: { id, name } },
//   board: Array(9),
//   turn: 'X' or 'O',
//   gameOver: boolean,
//   winner: null or 'X' or 'O',
//   winLine: null or Array of 3 indices,
//   nextStarts: 'X' or 'O'  // who starts next game
// }
const rooms = new Map();

io.on('connection', (socket) => {
  console.log(`Socket ${socket.id} connected`);

  // ---- CREATE ROOM ----
  socket.on('createRoom', ({ playerName }) => {
    const roomId = generateRoomId();
    const room = {
      players: {
        X: { id: socket.id, name: playerName.trim() || 'Player X' },
        O: null
      },
      board: Array(9).fill(null),
      turn: 'X',
      gameOver: false,
      winner: null,
      winLine: null,
      nextStarts: 'X'  // first game starts with X
    };
    rooms.set(roomId, room);
    socket.join(roomId);
    socket.emit('roomCreated', {
      roomId,
      symbol: 'X',
      playerNames: { X: room.players.X.name, O: null }
    });
    console.log(`Room ${roomId} created by ${socket.id} (${room.players.X.name})`);
  });

  // ---- JOIN ROOM ----
  socket.on('joinRoom', ({ roomId, playerName }) => {
    const room = rooms.get(roomId);
    if (!room) {
      socket.emit('joinError', 'Room does not exist');
      return;
    }
    if (room.players.O) {
      socket.emit('joinError', 'Room is full');
      return;
    }
    if (room.gameOver) {
      socket.emit('joinError', 'Game already finished');
      return;
    }
    room.players.O = { id: socket.id, name: playerName.trim() || 'Player O' };
    socket.join(roomId);
    socket.emit('roomJoined', {
      roomId,
      symbol: 'O',
      playerNames: { X: room.players.X.name, O: room.players.O.name }
    });
    io.to(roomId).emit('gameStart', {
      board: room.board,
      turn: room.turn,
      playerNames: { X: room.players.X.name, O: room.players.O.name }
    });
    console.log(`Socket ${socket.id} (${room.players.O.name}) joined room ${roomId}`);
  });

  // ---- MAKE MOVE ----
  socket.on('makeMove', ({ roomId, index }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    if (room.gameOver) return;

    let playerSymbol = null;
    if (room.players.X && room.players.X.id === socket.id) playerSymbol = 'X';
    else if (room.players.O && room.players.O.id === socket.id) playerSymbol = 'O';
    if (!playerSymbol) return;
    if (playerSymbol !== room.turn) return;
    if (room.board[index] !== null) return;

    room.board[index] = playerSymbol;
    const winInfo = checkWin(room.board);
    if (winInfo) {
      room.gameOver = true;
      room.winner = playerSymbol;
      room.winLine = winInfo.line;
      const winnerName = room.players[playerSymbol].name;
      io.to(roomId).emit('gameOver', {
        board: room.board,
        winner: playerSymbol,
        winnerName,
        winLine: winInfo.line,
        draw: false,
      });
      return;
    }
    if (room.board.every(cell => cell !== null)) {
      room.gameOver = true;
      room.winner = null;
      io.to(roomId).emit('gameOver', {
        board: room.board,
        winner: null,
        winnerName: null,
        winLine: null,
        draw: true,
      });
      return;
    }
    room.turn = room.turn === 'X' ? 'O' : 'X';
    io.to(roomId).emit('moveMade', {
      board: room.board,
      turn: room.turn,
    });
  });

  // ---- RESTART (toggle starting player) ----
  socket.on('restartGame', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    // Toggle who starts next game
    const nextStarts = room.nextStarts === 'X' ? 'O' : 'X';
    room.nextStarts = nextStarts;

    room.board = Array(9).fill(null);
    room.turn = nextStarts;
    room.gameOver = false;
    room.winner = null;
    room.winLine = null;

    io.to(roomId).emit('gameRestarted', {
      board: room.board,
      turn: room.turn,
    });
    console.log(`Game restarted in room ${roomId}, next starts: ${nextStarts}`);
  });

  // ---- LEAVE ROOM ----
  socket.on('leaveRoom', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    let playerRemoved = false;
    if (room.players.X && room.players.X.id === socket.id) {
      room.players.X = null;
      playerRemoved = true;
    } else if (room.players.O && room.players.O.id === socket.id) {
      room.players.O = null;
      playerRemoved = true;
    }

    if (playerRemoved) {
      const otherPlayer = room.players.X || room.players.O;
      if (otherPlayer) {
        io.to(roomId).emit('opponentLeft');
      }
      rooms.delete(roomId); // clean up
      socket.leave(roomId);
      socket.emit('leftRoom', { roomId });
    }
  });

  // ---- DISCONNECT ----
  socket.on('disconnect', () => {
    console.log(`Socket ${socket.id} disconnected`);
    for (const [roomId, room] of rooms.entries()) {
      let playerLeft = false;
      if (room.players.X && room.players.X.id === socket.id) {
        room.players.X = null;
        playerLeft = true;
      } else if (room.players.O && room.players.O.id === socket.id) {
        room.players.O = null;
        playerLeft = true;
      }
      if (playerLeft) {
        const otherPlayer = room.players.X || room.players.O;
        if (otherPlayer) {
          io.to(roomId).emit('opponentLeft');
        }
        rooms.delete(roomId);
        break;
      }
    }
  });
});

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function checkWin(board) {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (let line of lines) {
    const [a,b,c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line };
    }
  }
  return null;
}

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});