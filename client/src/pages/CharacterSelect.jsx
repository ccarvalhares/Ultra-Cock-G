import React, { useEffect, useState } from 'react';
import axios from 'axios';
import CharacterCard from '../components/CharacterCard';
import { useNavigate } from 'react-router-dom';

const CharacterSelect = () => {
    const [characters, setCharacters] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCharacters = async () => {
            try {
                const res = await axios.get('http://localhost:3000/api/characters');
                setCharacters(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchCharacters();
    }, []);

    const handleSelect = (character) => {
        // In a real app, we would save the selection to the backend here
        console.log('Selected:', character);
        navigate('/battle');
    };

    return (
        <div>
            <h2 className="text-3xl font-bold text-white mb-6 text-center">Choose Your Fighter</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {characters.map((char, index) => (
                    <CharacterCard key={index} character={char} onSelect={handleSelect} />
                ))}
            </div>
        </div>
    );
};

export default CharacterSelect;
