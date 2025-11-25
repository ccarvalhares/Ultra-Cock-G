import React from 'react';

const CharacterCard = ({ character, onSelect }) => {
    return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-red-500 transition cursor-pointer transform hover:-translate-y-1" onClick={() => onSelect(character)}>
            <h3 className="text-xl font-bold text-red-400 mb-2">{character.name}</h3>
            <p className="text-gray-400 text-sm mb-4">{character.description}</p>
            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span>Class:</span>
                    <span className="text-white">{character.class.name}</span>
                </div>
                <div className="flex justify-between">
                    <span>HP:</span>
                    <span className="text-green-400">{character.class.baseStats.hp}</span>
                </div>
                <div className="flex justify-between">
                    <span>MP:</span>
                    <span className="text-blue-400">{character.class.baseStats.mp}</span>
                </div>
            </div>
        </div>
    );
};

export default CharacterCard;
