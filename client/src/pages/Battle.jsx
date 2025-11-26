import React, { useEffect, useState } from 'react';
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
    const [logs, setLogs] = useState([]);

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
            setGameStatus("Connected to Lobby");
            newSocket.emit('join_game', {
                discordId: user.discordId,
                username: user.username,
                avatar: user.avatar
            });
        });

        newSocket.on('player_list', (list) => {
            setPlayers(list);
            // Check if I am ready
            const me = list.find(p => p.discordId === user.discordId);
            if (me && me.isReady) {
                setGameStatus("Waiting for other players...");
            }
        });

        newSocket.on('game_start', (state) => {
            setGameState(state);
            setGameStatus("BATTLE START!");
        });

        newSocket.on('turn_update', (state) => {
            setGameState(state);
            setLogs(state.logs);
        });

        newSocket.on('game_over', (winner) => {
            setGameStatus(`GAME OVER! Winner: ${winner.username}`);
            setTimeout(() => {
                setGameState(null);
                setSelectedChar(null);
                setLogs([]);
            }, 10000);
        });

        newSocket.on('action_error', (msg) => {
            alert(msg);
        });

        return () => newSocket.close();
    }, [user]);

    const handleSelectChar = (char) => {
        setSelectedChar(char);
        socket.emit('select_character', char);
    };

    const handleAction = (skill, targetId) => {
        if (!gameState) return;
        socket.emit('submit_action', {
            attackerId: socket.id,
            targetId: targetId,
            skill: skill
        });
    };

    if (!user) return <div className="text-white text-center mt-20">Loading User...</div>;

    // LOBBY / CHARACTER SELECT
    if (!gameState) {
        return (
            <div className="text-center mt-10">
                <h1 className="text-5xl font-bold text-red-600 mb-4">LOBBY</h1>
                <h2 className="text-2xl text-white mb-8">{gameStatus}</h2>

                {/* Player List */}
                <div className="flex justify-center gap-8 mb-12">
                    {players.map((p, index) => (
                        <div key={index} className="flex flex-col items-center">
                            <img
                                src={`https://cdn.discordapp.com/avatars/${p.discordId}/${p.avatar}.png`}
                                alt={p.username}
                                className={`w-16 h-16 rounded-full border-4 ${p.isReady ? 'border-green-500' : 'border-gray-500'}`}
                            />
                            <span className="text-white mt-2">{p.username}</span>
                            <span className="text-xs text-gray-400">{p.isReady ? 'READY' : 'SELECTING...'}</span>
                        </div>
                    ))}
                </div>

                {/* Character Grid */}
                {!selectedChar && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto px-4">
                        {characters.map((char, idx) => (
                            <CharacterCard key={idx} character={char} onSelect={handleSelectChar} />
                        ))}
                    </div>
                )}

                {selectedChar && (
                    <div className="text-white">
                        <p>You selected: <span className="font-bold text-red-400">{selectedChar.name}</span></p>
                        <p className="text-sm text-gray-400">Waiting for others to start...</p>
                    </div>
                )}
            </div>
        );
    }

    // BATTLE INTERFACE
    const currentPlayer = gameState.players[gameState.turnIndex];
    const isMyTurn = currentPlayer.socketId === socket.id;
    const myPlayer = gameState.players.find(p => p.socketId === socket.id);

    return (
        <div className="max-w-7xl mx-auto p-4">
            {/* Turn Indicator */}
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-white mb-2">{gameStatus}</h1>
                <div className={`text-2xl font-bold ${isMyTurn ? 'text-green-400 animate-pulse' : 'text-yellow-500'}`}>
                    {isMyTurn ? "YOUR TURN!" : `${currentPlayer.username}'s Turn`}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Players */}
                {gameState.players.map((p, idx) => (
                    <div key={idx} className={`bg-gray-800 p-6 rounded-lg border-2 ${p.socketId === currentPlayer.socketId ? 'border-yellow-500' : 'border-gray-700'} ${p.isDead ? 'opacity-50 grayscale' : ''}`}>
                        <div className="flex items-center gap-4 mb-4">
                            <img
                                src={`https://cdn.discordapp.com/avatars/${p.discordId}/${p.avatar}.png`}
                                className="w-16 h-16 rounded-full"
                            />
                            <div>
                                <h3 className="text-xl font-bold text-white">{p.username}</h3>
                                <p className="text-red-400">{p.character.name} ({p.class.name})</p>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="space-y-2">
                            <div className="w-full bg-gray-700 rounded-full h-4">
                                <div className="bg-red-600 h-4 rounded-full transition-all duration-500" style={{ width: `${(p.hp / p.maxHp) * 100}%` }}></div>
                            </div>
                            <div className="flex justify-between text-sm text-gray-300">
                                <span>HP: {p.hp}/{p.maxHp}</span>
                            </div>

                            <div className="w-full bg-gray-700 rounded-full h-4">
                                <div className="bg-blue-600 h-4 rounded-full transition-all duration-500" style={{ width: `${(p.mp / p.maxMp) * 100}%` }}></div>
                            </div>
                            <div className="flex justify-between text-sm text-gray-300">
                                <span>MP: {p.mp}/{p.maxMp}</span>
                            </div>
                        </div>

                        {/* Action Buttons (Only show on enemies if it's my turn) */}
                        {isMyTurn && p.socketId !== socket.id && !p.isDead && !myPlayer.isDead && (
                            <div className="mt-4 grid grid-cols-2 gap-2">
                                {Skills[myPlayer.class.name.toUpperCase()].map((skill, sIdx) => (
                                    <button
                                        key={sIdx}
                                        disabled={myPlayer.mp < skill.cost || (myPlayer.cooldowns[skill.name] > 0)}
                                        onClick={() => handleAction(skill, p.socketId)}
                                        className="bg-red-900 hover:bg-red-700 disabled:bg-gray-600 text-white text-xs py-2 px-1 rounded transition"
                                    >
                                        {skill.name} ({skill.cost} MP)
                                        {myPlayer.cooldowns[skill.name] > 0 && ` [CD: ${myPlayer.cooldowns[skill.name]}]`}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Combat Log */}
            <div className="mt-8 bg-black bg-opacity-50 p-4 rounded-lg h-48 overflow-y-auto border border-gray-700 font-mono text-sm">
                {logs.map((log, i) => (
                    <div key={i} className="text-green-400 border-b border-gray-800 py-1">
                        {`> ${log}`}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Battle;
