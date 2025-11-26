require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const passport = require('passport');
const session = require('express-session');

// Passport Config
require('./src/infrastructure/auth/passportConfig');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
    origin: 'http://localhost:5173', // Vite default port
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Trust proxy for Render
app.set('trust proxy', 1);

// Session & Passport
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // true on Render
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Cross-site cookie
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
}));
app.use(passport.initialize());
app.use(passport.session());

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// Auth Routes
app.get('/auth/discord', passport.authenticate('discord'));

app.get('/auth/discord/callback',
    passport.authenticate('discord', { failureRedirect: '/' }),
    (req, res) => {
        if (process.env.NODE_ENV === 'production') {
            res.redirect('/dashboard');
        } else {
            res.redirect('http://localhost:5173/dashboard');
        }
    }
);

app.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        res.redirect('/');
    });
});

app.get('/api/user', (req, res) => {
    if (req.isAuthenticated()) {
        res.json(req.user);
    } else {
        res.status(401).json({ message: 'Unauthorized' });
    }
});

const { Characters } = require('./src/domain/GameConfig');
app.get('/api/characters', (req, res) => {
    res.json(Characters);
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
    const path = require('path');
    app.use(express.static(path.join(__dirname, 'client/dist')));

    app.get(/(.*)/, (req, res) => {
        res.sendFile(path.join(__dirname, 'client/dist', 'index.html'));
    });
} else {
    // Basic Route for Dev
    app.get('/', (req, res) => {
        res.send('Ultra Cock G API is running. Frontend runs on port 5173 in dev.');
    });
}

const http = require('http');
const { Server } = require("socket.io");

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.NODE_ENV === 'production' ? "https://ultra-cock-g.onrender.com" : "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Game State
const GameState = require('./src/domain/GameState');
let queues = {
    '1v1': [],
    '1v1v1': []
};
let activeGames = {}; // { gameId: GameState }

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join_queue', ({ userData, mode }) => {
        // Remove from other queues first
        for (const m in queues) {
            queues[m] = queues[m].filter(p => p.discordId !== userData.discordId);
        }

        // Add to selected queue
        const player = { ...userData, socketId: socket.id, isReady: false, mode };
        queues[mode].push(player);
        socket.join(mode); // Join room

        io.to(mode).emit('queue_update', queues[mode]);

        // Check if queue is full
        const requiredPlayers = mode === '1v1' ? 2 : 3;
        if (queues[mode].length >= requiredPlayers) {
            // Create Game
            const players = queues[mode].splice(0, requiredPlayers);
            const gameId = `game_${Date.now()}_${mode}`;

            const game = new GameState(players);
            activeGames[gameId] = game;

            // Notify players
            players.forEach(p => {
                const s = io.sockets.sockets.get(p.socketId);
                if (s) {
                    s.leave(mode);
                    s.join(gameId);
                    s.emit('game_found', { gameId, players });
                }
            });
        }
    });

    socket.on('select_character', ({ gameId, character }) => {
        const game = activeGames[gameId];
        if (!game) return;

        const player = game.players.find(p => p.socketId === socket.id);
        if (player) {
            player.character = character;
            player.class = character.class;
            player.isReady = true;

            io.to(gameId).emit('player_list_update', game.players);

            // Check if all ready
            if (game.players.every(p => p.isReady)) {
                game.startBattle();
                io.to(gameId).emit('game_start', game.getState());
            }
        }
    });

    socket.on('player_move', ({ gameId, position, rotation }) => {
        const game = activeGames[gameId];
        if (game) {
            game.updatePlayerPosition(socket.id, position, rotation);
            socket.to(gameId).emit('player_moved', {
                socketId: socket.id,
                position,
                rotation
            });
        }
    });

    socket.on('submit_action', ({ gameId, action }) => {
        const game = activeGames[gameId];
        if (!game) return;

        const result = game.processAction(action);
        if (result.valid) {
            io.to(gameId).emit('game_update', game.getState());

            if (game.winner) {
                io.to(gameId).emit('game_over', game.winner);
                delete activeGames[gameId];
            }
        } else {
            socket.emit('action_error', result.message);
        }
    });

    socket.on('disconnect', () => {
        // Remove from queues
        for (const m in queues) {
            queues[m] = queues[m].filter(p => p.socketId !== socket.id);
            io.to(m).emit('queue_update', queues[m]);
        }

        // Handle active games (abort)
        for (const id in activeGames) {
            const game = activeGames[id];
            if (game.players.find(p => p.socketId === socket.id)) {
                io.to(id).emit('game_over', { username: "Game Aborted (Player Disconnected)" });
                delete activeGames[id];
            }
        }
    });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error("Global Error Handler:", err.stack);
    res.status(500).send('Internal Server Error: ' + err.message);
});

// Start Server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
