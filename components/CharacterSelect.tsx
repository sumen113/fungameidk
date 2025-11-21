import React, { useState } from 'react';
import { CharacterType } from '../types';
import { CHARACTERS } from '../constants';

interface CharacterSelectProps {
  isPvP: boolean;
  onStart: (p1: CharacterType, p2: CharacterType) => void;
  onBack: () => void;
}

export const CharacterSelect: React.FC<CharacterSelectProps> = ({ isPvP, onStart, onBack }) => {
  const [p1Selected, setP1Selected] = useState<CharacterType | null>(null);
  const [p2Selected, setP2Selected] = useState<CharacterType | null>(null);
  const [selectingFor, setSelectingFor] = useState<1 | 2>(1);

  const handleSelect = (char: CharacterType) => {
    if (selectingFor === 1) {
      setP1Selected(char);
      if (isPvP) {
        setSelectingFor(2);
      } else {
        // PvE: Randomly select CPU
        const chars = Object.values(CharacterType);
        const randomChar = chars[Math.floor(Math.random() * chars.length)];
        onStart(char, randomChar);
      }
    } else {
      setP2Selected(char);
      if (p1Selected) {
        onStart(p1Selected, char);
      }
    }
  };

  return (
    <div className="w-full h-screen bg-gray-900 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900 via-gray-900 to-black opacity-80"></div>

      <h1 className="relative z-10 font-arcade text-5xl text-white mb-8 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
        {selectingFor === 1 ? "SELECT PLAYER 1" : "SELECT PLAYER 2"}
      </h1>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl w-full px-8">
        {Object.values(CharacterType).map((type) => {
          const info = CHARACTERS[type];
          return (
            <button
              key={type}
              onClick={() => handleSelect(type)}
              className="group relative flex flex-col items-center bg-gray-800/80 border-2 border-gray-600 rounded-xl p-6 hover:border-white transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] text-left overflow-hidden"
              style={{ borderColor: info.color }}
            >
              {/* Color Overlay on Hover */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                style={{ backgroundColor: info.color }}
              ></div>

              {/* Icon/Avatar Placeholder */}
              <div 
                className="w-24 h-24 rounded-full border-4 border-white mb-4 shadow-lg flex items-center justify-center text-3xl font-bold"
                style={{ backgroundColor: info.color }}
              >
                {info.name[0]}
              </div>

              <h2 className="font-arcade text-2xl text-white mb-2" style={{ color: info.color }}>{info.name}</h2>
              <div className="w-full h-px bg-gray-600 mb-4"></div>
              
              <p className="text-yellow-400 font-bold text-sm mb-1">SPECIAL: {info.ability}</p>
              <p className="text-gray-300 text-sm text-center h-12">{info.desc}</p>

              <div className="mt-4 px-4 py-2 bg-black/40 rounded text-xs text-gray-400 font-mono group-hover:text-white transition-colors">
                CLICK TO SELECT
              </div>
            </button>
          );
        })}
      </div>

      <button 
        onClick={onBack}
        className="relative z-10 mt-12 text-gray-500 hover:text-white font-arcade text-xl transition-colors border-b border-transparent hover:border-white"
      >
        BACK TO MENU
      </button>
    </div>
  );
};
