import React from 'react';

const Battle = () => {
    return (
        <div className="text-center mt-20">
            <h1 className="text-5xl font-bold text-red-600 mb-4">BATTLE ARENA</h1>
            <p className="text-xl text-gray-400">Waiting for opponent...</p>
            <div className="mt-8 animate-pulse">
                <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full mx-auto animate-spin"></div>
            </div>
        </div>
    );
};

export default Battle;
