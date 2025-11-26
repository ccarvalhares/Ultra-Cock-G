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
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
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

// Game State (In-memory for now)
let connectedPlayers = [];

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join_game', (userData) => {
        // Avoid duplicates
        if (!connectedPlayers.find(p => p.discordId === userData.discordId)) {
            connectedPlayers.push({ ...userData, socketId: socket.id });
        }

        io.emit('player_list', connectedPlayers);

        if (connectedPlayers.length >= 3) {
            io.emit('game_ready', { message: "3 Players Connected! Game Starting..." });
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        connectedPlayers = connectedPlayers.filter(p => p.socketId !== socket.id);
        io.emit('player_list', connectedPlayers);
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
