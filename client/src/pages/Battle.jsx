import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import CharacterCard from '../components/CharacterCard';

const Battle = () => {
    const [socket, setSocket] = useState(null);
    const [user, setUser] = useState(null);
    const [players, setPlayers] = useState([]);
    const [gameState, setGameState] = useState(null);
    const [characters, setCharacters] = useState([]);
    const [selectedChar, setSelectedChar] = useState(null);
    const [gameStatus, setGameStatus] = useState('Connecting...');
    const [gameId, setGameId] = useState(null);
    const [selectedMode, setSelectedMode] = useState(null);

    // Canvas Ref
    const canvasRef = useRef(null);

    // Movement State
    const keys = useRef({});
    const myPosition = useRef({ x: 0, y: 0, z: 0 });
    const myRotation = useRef(0);

    // Fetch User & Characters
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [userRes, charRes] = await Promise.all([
                    axios.get('/api/user', { withCredentials: true }),
                    axios.get('/api/characters')
                ]);
                setUser(userRes.data);
                setCharacters(charRes.data);
            } catch (err) {
                console.error("Failed to fetch data", err);
            }
        };
        fetchData();
    }, []);

    // Connect Socket
    useEffect(() => {
        if (!user) return;

        const newSocket = io(import.meta.env.PROD ? "https://ultra-cock-g.onrender.com" : "http://localhost:3000", {
            withCredentials: true
        });

        setSocket(newSocket);

        newSocket.on('connect', () => {
            setGameStatus("Select Game Mode");
        });

        newSocket.on('queue_update', (list) => {
            setPlayers(list);
            setGameStatus(`In Queue (${list.length} players)`);
        });

        newSocket.on('game_found', ({ gameId, players }) => {
            setGameId(gameId);
            setPlayers(players);
            setGameStatus("Game Found! Select Character");
        });

        newSocket.on('player_list_update', (list) => {
            setPlayers(list);
        });

        newSocket.on('game_start', (state) => {
            setGameState(state);
            setGameStatus("BATTLE START!");

            // Initialize my position
            const me = state.players.find(p => p.discordId === user.discordId);
            if (me) {
                myPosition.current = me.position;
            }
        });

        newSocket.on('game_update', (state) => {
            setGameState(state);
        });

        newSocket.on('player_moved', (data) => {
            setGameState(prev => {
                if (!prev) return null;
                const newPlayers = prev.players.map(p => {
                    if (p.socketId === data.socketId) {
                        return { ...p, position: data.position, rotation: data.rotation };
                    }
                    return p;
                });
                return { ...prev, players: newPlayers };
            });
        });

        newSocket.on('game_over', (winner) => {
            setGameStatus(`GAME OVER! Winner: ${winner.username}`);
            setTimeout(() => {
                setGameState(null);
                setGameId(null);
                setSelectedChar(null);
                setSelectedMode(null);
                setGameStatus("Select Game Mode");
            }, 10000);
        });

        return () => newSocket.close();
    }, [user]);

    // Input Handling
    useEffect(() => {
        const handleKeyDown = (e) => keys.current[e.code] = true;
        const handleKeyUp = (e) => keys.current[e.code] = false;
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // Game Loop (Movement & Rendering)
    useEffect(() => {
        if (!gameState || !socket || !gameId || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        // SCALE FACTOR (World Units -> Pixels)
        const SCALE = 40;
        const CENTER_X = canvas.width / 2;
        const CENTER_Y = canvas.height / 2;

        const render = () => {
            // 1. Movement Logic
            let moved = false;
            const speed = 0.2;

            if (keys.current['KeyW']) { myPosition.current.z -= speed; moved = true; myRotation.current = Math.PI; }
            if (keys.current['KeyS']) { myPosition.current.z += speed; moved = true; myRotation.current = 0; }
            if (keys.current['KeyA']) { myPosition.current.x -= speed; moved = true; myRotation.current = Math.PI / 2; }
            if (keys.current['KeyD']) { myPosition.current.x += speed; moved = true; myRotation.current = -Math.PI / 2; }

            if (moved) {
                socket.emit('player_move', {
                    gameId,
                    position: myPosition.current,
                    rotation: myRotation.current
                });

                // Optimistic Update
                setGameState(prev => {
                    const newPlayers = prev.players.map(p => {
                        if (p.discordId === user.discordId) {
                            return { ...p, position: { ...myPosition.current }, rotation: myRotation.current };
                        }
                        return p;
                    });
                    return { ...prev, players: newPlayers };
                });
            }

            // 2. Rendering Logic
            // Clear Screen
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw Grid
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            const gridSize = 50;
            const offsetX = (myPosition.current.x * SCALE) % gridSize;
            const offsetY = (myPosition.current.z * SCALE) % gridSize;

            for (let x = -gridSize; x < canvas.width + gridSize; x += gridSize) {
                ctx.beginPath();
                ctx.moveTo(x - offsetX, 0);
                ctx.lineTo(x - offsetX, canvas.height);
                ctx.stroke();
            }
            for (let y = -gridSize; y < canvas.height + gridSize; y += gridSize) {
                ctx.beginPath();
                ctx.moveTo(0, y - offsetY);
                ctx.lineTo(canvas.width, y - offsetY);
                ctx.stroke();
            }

            // Draw Players
            gameState.players.forEach(p => {
                if (p.isDead) return;

                // Convert World Pos to Screen Pos (Relative to Me)
                // Me is always at CENTER_X, CENTER_Y
                const relX = (p.position.x - myPosition.current.x) * SCALE;
                const relY = (p.position.z - myPosition.current.z) * SCALE;

                const screenX = CENTER_X + relX;
                const screenY = CENTER_Y + relY;

                // Draw Shadow
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.beginPath();
                ctx.ellipse(screenX, screenY + 20, 15, 8, 0, 0, Math.PI * 2);
                ctx.fill();

                // Draw Body (Circle)
                ctx.fillStyle = p.discordId === user.discordId ? '#4ade80' : '#f87171';
                ctx.beginPath();
                ctx.arc(screenX, screenY, 20, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Draw Direction Indicator
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(screenX, screenY);
                ctx.lineTo(
                    screenX + Math.sin(p.rotation) * 30,
                    screenY + Math.cos(p.rotation) * 30
                );
                ctx.stroke();

                // Draw Username
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(p.username, screenX, screenY - 35);

                // Draw HP Bar
                const hpWidth = 40;
                const hpHeight = 6;
                const hpPct = p.hp / p.maxHp;
                ctx.fillStyle = '#333';
                ctx.fillRect(screenX - hpWidth / 2, screenY - 30, hpWidth, hpHeight);
                ctx.fillStyle = '#ef4444';
                ctx.fillRect(screenX - hpWidth / 2, screenY - 30, hpWidth * hpPct, hpHeight);
            });

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(animationFrameId);
            clearInterval(interval); // Clear movement interval if it was separate
        };
    }, [gameState, socket, user, gameId]);

    const handleJoinQueue = (mode) => {
        setSelectedMode(mode);
        socket.emit('join_queue', {
            userData: {
                discordId: user.discordId,
                username: user.username,
                avatar: user.avatar,
                discriminator: user.discriminator
            },
            mode
        });
    };

    const handleSelectChar = (char) => {
        setSelectedChar(char);
        socket.emit('select_character', { gameId, character: char });
    };

    const handleAttack = (skill) => {
        if (!gameState || !gameId) return;
        const me = gameState.players.find(p => p.discordId === user.discordId);
        const enemies = gameState.players.filter(p => p.discordId !== user.discordId && !p.isDead);

        // Simple range check (e.g., 5 units)
        const target = enemies.find(e => {
            const dx = e.position.x - me.position.x;
            const dz = e.position.z - me.position.z;
            return Math.sqrt(dx * dx + dz * dz) < 5;
        });

        if (target) {
            socket.emit('submit_action', {
                gameId,
                action: {
                    attackerId: socket.id,
                    targetId: target.socketId,
                    skill: skill
                }
            });
        }
    };

    const getAvatarUrl = (p) => {
        if (p.avatar) {
            return `https://cdn.discordapp.com/avatars/${p.discordId}/${p.avatar}.png`;
        }
        const disc = p.discriminator || '0';
        const index = disc === '0' ? (BigInt(p.discordId) >> 22n) % 6n : parseInt(disc) % 5;
        return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
    };

    if (!user) return <div className="text-white text-center mt-20">Loading User...</div>;

    // MODE SELECTION
    if (!selectedMode) {
        return (
            <div className="text-center mt-20">
                <h1 className="text-5xl font-bold text-red-600 mb-8">SELECT GAME MODE</h1>
                <div className="flex justify-center gap-8">
                    <button
                        onClick={() => handleJoinQueue('1v1')}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-2xl font-bold py-8 px-12 rounded-lg border-4 border-blue-400 transition transform hover:scale-105"
                    >
                        1 v 1
                    </button>
                    <button
                        onClick={() => handleJoinQueue('1v1v1')}
                        className="bg-red-600 hover:bg-red-500 text-white text-2xl font-bold py-8 px-12 rounded-lg border-4 border-red-400 transition transform hover:scale-105"
                    >
                        1 v 1 v 1
                    </button>
                </div>
            </div>
        );
    }

    // LOBBY / CHARACTER SELECT
    if (!gameState) {
        return (
            <div className="text-center mt-10">
                <h1 className="text-5xl font-bold text-red-600 mb-4">LOBBY ({selectedMode})</h1>
                <h2 className="text-2xl text-white mb-8">{gameStatus}</h2>

                <div className="flex justify-center gap-8 mb-12">
                    {players.map((p, index) => (
                        <div key={index} className="flex flex-col items-center">
                            <img
                                src={getAvatarUrl(p)}
                                alt={p.username}
                                className={`w-16 h-16 rounded-full border-4 ${p.isReady ? 'border-green-500' : 'border-gray-500'}`}
                                onError={(e) => { e.target.onerror = null; e.target.src = "https://cdn.discordapp.com/embed/avatars/0.png"; }}
                            />
                            <span className="text-white mt-2">{p.username}</span>
                        </div>
                    ))}
                </div>

                {gameId && !selectedChar && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto px-4">
                        {characters.map((char, idx) => (
                            <CharacterCard key={idx} character={char} onSelect={handleSelectChar} />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // 2D CANVAS BATTLE
    const me = gameState.players.find(p => p.discordId === user.discordId);

    return (
        <div className="w-full h-screen relative bg-black flex justify-center items-center">
            {/* Canvas Renderer */}
            <canvas
                ref={canvasRef}
                width={800}
                height={600}
                className="border-4 border-gray-700 rounded-lg bg-[#1a1a1a] shadow-2xl"
            />

            {/* UI Overlay */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 p-4 rounded-lg flex gap-2 border border-gray-600">
                {me && !me.isDead && me.class.skills.map((skill, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleAttack(skill)}
                        className="bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded font-bold text-sm border-b-4 border-red-900 active:border-b-0 active:translate-y-1 transition-all"
                    >
                        {skill.name}
                    </button>
                ))}
            </div>

            {/* Top Status */}
            <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-white font-bold text-2xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] tracking-wider">
                {gameStatus}
            </div>

            {/* Controls Info */}
            <div className="absolute top-8 right-8 text-gray-400 text-sm bg-black bg-opacity-50 p-2 rounded">
                <p>WASD to Move</p>
                <p>Click Skills to Attack</p>
            </div>
        </div>
    );
};

export default Battle;
