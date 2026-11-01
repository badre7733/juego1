// ==========================================
// QUANTUM VOID - AUTHORITATIVE GAME SERVER
// Node.js + Express + Socket.IO + SQLite
// ==========================================

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const db = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// Rooms Memory Store
const rooms = {};

// Helper: Generate unique 6-digit Room Code
function generateRoomCode() {
    return 'QV-' + Math.floor(1000 + Math.random() * 9000);
}

io.on('connection', (socket) => {
    console.log(`[NET] Jugador Conectado: ${socket.id}`);

    // Create Room
    socket.on('createRoom', ({ roomName, playerInfo }) => {
        const roomCode = generateRoomCode();
        rooms[roomCode] = {
            code: roomCode,
            name: roomName,
            players: {},
            projectiles: []
        };
        
        socket.join(roomCode);
        rooms[roomCode].players[socket.id] = {
            id: socket.id,
            x: 400, y: 300, vx: 0, vy: 0, angle: 0,
            shield: 100, hull: 100,
            shipClass: playerInfo.shipClass || 'scout'
        };

        socket.emit('roomJoined', { roomCode, state: rooms[roomCode] });
        io.emit('roomListUpdate', Object.values(rooms));
    });

    // Sync State Loop (Authoritative Movement)
    socket.on('playerInput', ({ roomCode, input }) => {
        const room = rooms[roomCode];
        if (!room || !room.players[socket.id]) return;

        const p = room.players[socket.id];
        if (input.thrust) {
            p.vx += Math.cos(p.angle) * 0.5;
            p.vy += Math.sin(p.angle) * 0.5;
        }
        if (input.left) p.angle -= 0.08;
        if (input.right) p.angle += 0.08;

        p.vx *= 0.98; p.vy *= 0.98;
        p.x += p.vx; p.y += p.vy;

        io.to(roomCode).emit('gameStateUpdate', room);
    });

    socket.on('disconnect', () => {
        console.log(`[NET] Jugador Desconectado: ${socket.id}`);
        // Clean up empty rooms
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`[QUANTUM VOID SERVER] Ejecutándose en puerto ${PORT}`);
});
