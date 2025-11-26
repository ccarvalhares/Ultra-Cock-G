import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

const Battle = () => {
    const [socket, setSocket] = useState(null);
    const [user, setUser] = useState(null);
    const [players, setPlayers] = useState([]);
    const [gameStatus, setGameStatus] = useState('Waiting for players...');

    // Fetch User
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await axios.get('/api/user', { withCredentials: true });
                setUser(res.data);
            } catch (err) {
                console.error("Failed to fetch user", err);
            }
        };
        fetchUser();
    }, []);

    // Connect Socket
    useEffect(() => {
        if (!user) return;

        const newSocket = io(import.meta.env.PROD ? "https://ultra-cock-g.onrender.com" : "http://localhost:3000", {
            withCredentials: true
        });

        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log("Connected to socket");
            newSocket.emit('join_game', {
                discordId: user.discordId,
                username: user.username,
                avatar: user.avatar
            });
        });

        newSocket.on('player_list', (list) => {
            setPlayers(list);
        });

        newSocket.on('game_ready', (data) => {
            setGameStatus(data.message);
        });

        return () => newSocket.close();
    }, [user]);

    if (!user) return <div className="text-white text-center mt-20">Loading User...</div>;

    return (
        <div className="text-center mt-10">
            <h1 className="text-5xl font-bold text-red-600 mb-4">BATTLE ARENA</h1>

            <div className="bg-gray-800 p-6 rounded-lg max-w-2xl mx-auto border border-gray-700">
                <h2 className="text-2xl text-white mb-4">{gameStatus}</h2>

                <div className="flex justify-center gap-8 mt-8">
                    {players.map((p, index) => (
                        <div key={index} className="flex flex-col items-center animate-fadeIn">
                            <img
                                src={`https://cdn.discordapp.com/avatars/${p.discordId}/${p.avatar}.png`}
                                alt={p.username}
                                className="w-20 h-20 rounded-full border-4 border-blue-500"
                            />
                            <span className="text-white mt-2 font-bold">{p.username}</span>
                        </div>
                    ))}

                    {[...Array(Math.max(0, 3 - players.length))].map((_, i) => (
                        <div key={`empty-${i}`} className="flex flex-col items-center opacity-50">
                            <div className="w-20 h-20 rounded-full border-4 border-gray-600 bg-gray-700 flex items-center justify-center">
                                <span className="text-2xl text-gray-500">?</span>
                            </div>
                            <span className="text-gray-500 mt-2">Waiting...</span>
                        </div>
                    ))}
                </div>

                <div className="mt-8 text-gray-400">
                    {players.length} / 3 Players Connected
                </div>
            </div>
        </div>
    );
};

export default Battle;
