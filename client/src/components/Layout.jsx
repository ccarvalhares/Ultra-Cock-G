import React from 'react';
import { Link } from 'react-router-dom';

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans">
            <nav className="bg-gray-800 p-4 border-b border-gray-700">
                <div className="container mx-auto flex justify-between items-center">
                    <Link to="/dashboard" className="text-2xl font-bold text-red-500 tracking-wider">
                        ULTRA COCK G
                    </Link>
                    <div className="space-x-4">
                        <Link to="/dashboard" className="hover:text-red-400 transition">Dashboard</Link>
                        <Link to="/character-select" className="hover:text-red-400 transition">Characters</Link>
                        <a href="http://localhost:3000/logout" className="hover:text-red-400 transition">Logout</a>
                    </div>
                </div>
            </nav>
            <main className="container mx-auto p-4">
                {children}
            </main>
            <footer className="bg-gray-800 p-4 mt-8 border-t border-gray-700 text-center text-gray-500">
                &copy; 2025 Ultra Cock G. All rights reserved.
            </footer>
        </div>
    );
};

export default Layout;
