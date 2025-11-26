import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import CharacterCard from '../components/CharacterCard';
import * as THREE from 'three';

// 3D Player Component
const Player3D = ({ position, rotation, isMe, username, avatar, hp, maxHp }) => {
    const meshRef = useRef();

    useFrame(() => {
        if (meshRef.current) {
            // Smooth interpolation could go here
            meshRef.current.position.lerp(new THREE.Vector3(position.x, position.y, position.z), 0.1);
            meshRef.current.rotation.y = rotation;
        }
    });

    return (
        <group ref={meshRef} position={[position.x, position.y, position.z]}>
            {/* Player Body */}
            <mesh position={[0, 1, 0]}>
                <capsuleGeometry args={[0.5, 1, 4, 8]} />
                <meshStandardMaterial color={isMe ? "green" : "red"} />
            </mesh>

            {/* Username & HP Bar */}
            <Html position={[0, 2.5, 0]} center>
                <div className="flex flex-col items-center pointer-events-none">
                    <div className="text-white font-bold text-sm bg-black bg-opacity-50 px-2 rounded mb-1 whitespace-nowrap">
                        {username}
                    </div>
                    <div className="w-16 h-2 bg-gray-700 rounded-full border border-black">
                        <div
                            className="h-full bg-red-500 rounded-full transition-all duration-300"
                            style={{ width: `${(hp / maxHp) * 100}%` }}
                        />
                    </div>
                </div>
            </Html>
        </group>
    );
};

const Battle = () => {
    const [socket, setSocket] = useState(null);
    const [user, setUser] = useState(null);
    const [players, setPlayers] = useState([]);
    const [gameState, setGameState] = useState(null);
    const [characters, setCharacters] = useState([]);
    const [selectedChar, setSelectedChar] = useState(null);
    const [gameStatus, setGameStatus] = useState('Connecting...');

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
            setGameStatus("Connected to Lobby");
            newSocket.emit('join_game', {
                discordId: user.discordId,
                username: user.username,
                avatar: user.avatar,
                discriminator: user.discriminator
            });
        });

        newSocket.on('player_list', (list) => {
            setPlayers(list);
            const me = list.find(p => p.discordId === user.discordId);
            if (me && me.isReady) {
                setGameStatus("Waiting for other players...");
            }
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
                setSelectedChar(null);
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

    // Game Loop (Movement)
    useEffect(() => {
        if (!gameState || !socket) return;

        const interval = setInterval(() => {
            let moved = false;
            const speed = 0.2;

            if (keys.current['KeyW']) { myPosition.current.z -= speed; moved = true; myRotation.current = Math.PI; }
            if (keys.current['KeyS']) { myPosition.current.z += speed; moved = true; myRotation.current = 0; }
            if (keys.current['KeyA']) { myPosition.current.x -= speed; moved = true; myRotation.current = Math.PI / 2; }
            if (keys.current['KeyD']) { myPosition.current.x += speed; moved = true; myRotation.current = -Math.PI / 2; }

            if (moved) {
                socket.emit('player_move', {
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
        }, 30); // 30ms tick

        return () => clearInterval(interval);
    }, [gameState, socket, user]);

    const handleSelectChar = (char) => {
        setSelectedChar(char);
        socket.emit('select_character', char);
    };

    const handleAttack = (skill) => {
        // Find closest target (simple logic for now)
        if (!gameState) return;
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
                attackerId: socket.id,
                targetId: target.socketId,
                skill: skill
            });
        } else {
            console.log("No target in range!");
        }
    };

    if (!user) return <div className="text-white text-center mt-20">Loading User...</div>;

    // LOBBY
    if (!gameState) {
        return (
            <div className="text-center mt-10">
                <h1 className="text-5xl font-bold text-red-600 mb-4">LOBBY</h1>
                <h2 className="text-2xl text-white mb-8">{gameStatus}</h2>

                <div className="flex justify-center gap-8 mb-12">
                    {players.map((p, index) => (
                        <div key={index} className="flex flex-col items-center">
                            <img
                                src={p.avatar ? `https://cdn.discordapp.com/avatars/${p.discordId}/${p.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${parseInt(p.discriminator) % 5}.png`}
                                alt={p.username}
                                className={`w-16 h-16 rounded-full border-4 ${p.isReady ? 'border-green-500' : 'border-gray-500'}`}
                            />
                            <span className="text-white mt-2">{p.username}</span>
                        </div>
                    ))}
                </div>

                {!selectedChar && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto px-4">
                        {characters.map((char, idx) => (
                            <CharacterCard key={idx} character={char} onSelect={handleSelectChar} />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // 3D BATTLE
    const me = gameState.players.find(p => p.discordId === user.discordId);

    return (
        <div className="w-full h-screen relative">
            {/* 3D Scene */}
            <Canvas camera={{ position: [0, 10, 10], fov: 50 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <OrbitControls />

                {/* Ground */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                    <planeGeometry args={[50, 50]} />
                    <meshStandardMaterial color="#333" />
                </mesh>

                {/* Players */}
                {gameState.players.map((p, idx) => (
                    !p.isDead && (
                        <Player3D
                            key={idx}
                            position={p.position}
                            rotation={p.rotation}
                            isMe={p.discordId === user.discordId}
                            username={p.username}
                            avatar={p.avatar}
                            hp={p.hp}
                            maxHp={p.maxHp}
                        />
                    )
                ))}
            </Canvas>

            {/* UI Overlay */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 p-4 rounded-lg flex gap-2">
                {me && !me.isDead && me.class.skills.map((skill, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleAttack(skill)}
                        className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded font-bold text-sm"
                    >
                        {skill.name}
                    </button>
                ))}
            </div>

            {/* Top Status */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-white font-bold text-xl drop-shadow-md">
                {gameStatus}
            </div>
        </div>
    );
};

export default Battle;
