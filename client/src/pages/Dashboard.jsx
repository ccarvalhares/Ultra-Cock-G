import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await axios.get('http://localhost:3000/api/user', { withCredentials: true });
                setUser(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchUser();
    }, []);

    if (!user) return <div className="text-white">Loading...</div>;

    return (
        <div className="space-y-8">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 flex items-center gap-6">
                <img src={`https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png`} alt="Avatar" className="w-20 h-20 rounded-full border-2 border-red-500" />
                <div>
                    <h2 className="text-3xl font-bold text-white">Welcome, {user.username}!</h2>
                    <p className="text-gray-400">Ready to fight?</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <h3 className="text-xl font-bold text-red-500 mb-4">Latest News</h3>
                    <ul className="space-y-2 text-gray-300">
                        <li>• Season 1 has started!</li>
                        <li>• New weapon: Void Katana added.</li>
                        <li>• Balancing patch v1.0.2 live.</li>
                    </ul>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 flex flex-col justify-center items-center">
                    <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
                    <Link to="/character-select" className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full transition transform hover:scale-105">
                        ENTER GAME
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
