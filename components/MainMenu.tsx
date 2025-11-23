import React from "react";
import { GameMode } from "../types";

interface MainMenuProps {
  onSelectMode: (mode: GameMode) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onSelectMode }) => {
  return (
    <div className="w-full h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black flex flex-col items-center justify-center overflow-hidden relative">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 bg-blue-500 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-red-500 rounded-full blur-[120px]"></div>
      </div>

      <h1 className="font-arcade text-6xl md:text-8xl text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 mb-12 drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)] tracking-wider transform -skew-x-6">
        SPIRIT
        <br />
        SOCCER
      </h1>

      <div className="flex flex-col gap-6 z-10 w-full max-w-xs">
        <button
          onClick={() => onSelectMode(GameMode.PVE)}
          className="group relative w-full py-4 bg-gray-800 hover:bg-blue-600 border-2 border-blue-400 text-white font-arcade text-xl rounded-lg transition-all duration-200 shadow-lg hover:shadow-blue-500/50 overflow-hidden"
        >
          <div className="absolute inset-0 w-full h-full bg-white/10 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
          <span className="relative z-10">1 PLAYER</span>
        </button>

        <button
          onClick={() => onSelectMode(GameMode.PVP)}
          className="group relative w-full py-4 bg-gray-800 hover:bg-red-600 border-2 border-red-400 text-white font-arcade text-xl rounded-lg transition-all duration-200 shadow-lg hover:shadow-red-500/50 overflow-hidden"
        >
          <div className="absolute inset-0 w-full h-full bg-white/10 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
          <span className="relative z-10">2 PLAYERS</span>
        </button>

        <button
          onClick={() => onSelectMode(GameMode.ONLINE)}
          className="group relative w-full py-4 bg-gray-800 hover:bg-purple-600 border-2 border-purple-400 text-white font-arcade text-xl rounded-lg transition-all duration-200 shadow-lg hover:shadow-purple-500/50 overflow-hidden"
        >
          <div className="absolute inset-0 w-full h-full bg-white/10 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
          <span className="relative z-10">ONLINE</span>
        </button>
      </div>

    </div>
  );
};
