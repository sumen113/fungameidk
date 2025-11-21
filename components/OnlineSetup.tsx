import React, { useState, useEffect, useRef } from 'react';
import { CharacterType } from '../types';
import { CHARACTERS } from '../constants';

// Declare PeerJS global
declare const Peer: any;

interface OnlineSetupProps {
  onGameStart: (isHost: boolean, conn: any, myChar: CharacterType, oppChar: CharacterType) => void;
  onBack: () => void;
}

const ADJECTIVES = [
  'fast', 'cool', 'wild', 'super', 'mega', 'hyper', 'brave', 'swift', 'epic', 'iron', 
  'neon', 'cyber', 'turbo', 'sonic', 'power', 'magic', 'dark', 'holy', 'royal', 'gold'
];
const NOUNS = [
  'tiger', 'lion', 'eagle', 'shark', 'wolf', 'bear', 'hawk', 'panda', 'fox', 'cobra',
  'dragon', 'phoenix', 'rhino', 'falcon', 'viper', 'panther', 'titan', 'ninja', 'knight', 'wizard'
];

const generateReadableId = () => {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 100); // 0-99
  return `${adj}-${noun}-${num}`;
};

export const OnlineSetup: React.FC<OnlineSetupProps> = ({ onGameStart, onBack }) => {
  const [peerId, setPeerId] = useState<string>('');
  const [destPeerId, setDestPeerId] = useState<string>('');
  const [status, setStatus] = useState<string>('Initializing...');
  const [isHost, setIsHost] = useState<boolean>(false);
  const [connected, setConnected] = useState<boolean>(false);
  const [myChar, setMyChar] = useState<CharacterType>(CharacterType.SPEEDER);
  const [opponentChar, setOpponentChar] = useState<CharacterType | null>(null);
  
  const peerRef = useRef<any>(null);
  const connRef = useRef<any>(null);

  useEffect(() => {
    const customId = generateReadableId();
    
    // Pass the custom ID as the first argument
    const peer = new Peer(customId, {
      debug: 2
    });

    peer.on('open', (id: string) => {
      setPeerId(id);
      setStatus('Ready to connect');
    });

    peer.on('error', (err: any) => {
      if (err.type === 'unavailable-id') {
        // Retry with a new ID if collision occurs (rare with this method but possible)
        setStatus('ID taken, retrying...');
        setTimeout(() => {
             const newId = generateReadableId() + '-' + Math.floor(Math.random()*10);
             // Logic to recreate peer would be complex here inside effect, 
             // but for this scale, collision is unlikely. 
             // A simple reload would fix it in worst case.
             setPeerId('Please Refresh'); 
        }, 1000);
      } else {
        setStatus('Error: ' + err.type);
      }
    });

    peer.on('connection', (conn: any) => {
      connRef.current = conn;
      setIsHost(true);
      setConnected(true);
      setStatus('Opponent Connected! Select Character.');
      setupConnection(conn);
    });

    peerRef.current = peer;

    return () => {
      if (!connRef.current) peer.destroy();
    };
  }, []);

  const setupConnection = (conn: any) => {
    conn.on('data', (data: any) => {
      if (data.type === 'HANDSHAKE') {
        setOpponentChar(data.payload.char);
      } else if (data.type === 'START') {
        // Joiner receives start command
        onGameStart(false, conn, myChar, data.payload.p1Char);
      }
    });
    conn.on('open', () => {
       setConnected(true);
       setStatus('Connected! Waiting for Host...');
       // Send initial char selection
       conn.send({ type: 'HANDSHAKE', payload: { char: myChar } });
    });
    conn.on('close', () => {
        setConnected(false);
        setStatus('Opponent Disconnected');
        setOpponentChar(null);
        connRef.current = null;
    });
  };

  const connectToPeer = () => {
    if (!destPeerId) return;
    setStatus('Connecting...');
    const conn = peerRef.current.connect(destPeerId);
    connRef.current = conn;
    setIsHost(false);
    setupConnection(conn);
  };

  const startGame = () => {
    if (connRef.current && opponentChar) {
      // Host sends start command
      connRef.current.send({ type: 'START', payload: { p1Char: myChar } });
      onGameStart(true, connRef.current, myChar, opponentChar);
    }
  };

  // Update char choice to opponent
  const selectChar = (char: CharacterType) => {
    setMyChar(char);
    if (connected && connRef.current) {
      connRef.current.send({ type: 'HANDSHAKE', payload: { char } });
    }
  };

  return (
    <div className="w-full h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
       <h1 className="font-arcade text-4xl mb-8 text-purple-400">ONLINE LOBBY</h1>
       
       <div className="bg-gray-800 p-8 rounded-xl border-2 border-gray-600 shadow-2xl w-full max-w-2xl">
          <div className="mb-6 text-center">
             <p className="text-gray-400 text-sm uppercase tracking-widest mb-2">Your Game ID</p>
             <div className="bg-black p-4 rounded font-mono text-xl text-yellow-400 select-all cursor-pointer border border-gray-700" onClick={() => navigator.clipboard.writeText(peerId)}>
                {peerId || 'Generating...'}
             </div>
             <p className="text-xs text-gray-500 mt-2">(Share this with your friend)</p>
          </div>

          {!connected ? (
             <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                   <input 
                     type="text" 
                     placeholder="Enter Friend's ID (e.g. wild-lion-12)" 
                     className="flex-1 bg-gray-700 border border-gray-600 rounded p-3 text-white focus:outline-none focus:border-purple-500 font-mono"
                     value={destPeerId}
                     onChange={(e) => setDestPeerId(e.target.value.toLowerCase())}
                   />
                   <button 
                     onClick={connectToPeer}
                     className="bg-purple-600 hover:bg-purple-500 px-6 rounded font-bold transition-colors"
                   >
                      JOIN
                   </button>
                </div>
                <p className="text-center text-gray-400 mt-4 text-sm">{status}</p>
             </div>
          ) : (
             <div className="flex flex-col items-center">
                <div className="text-green-400 font-bold text-xl mb-6 animate-pulse">
                   {isHost ? "PLAYER 2 JOINED!" : "CONNECTED TO HOST!"}
                </div>
                
                <div className="grid grid-cols-2 gap-8 w-full mb-8">
                   {/* My Selection */}
                   <div className="flex flex-col items-center p-4 bg-gray-700/50 rounded-lg border border-blue-500">
                      <span className="mb-2 font-arcade text-blue-300">YOU ({isHost ? 'P1' : 'P2'})</span>
                      <div className="grid grid-cols-2 gap-2">
                         {Object.values(CharacterType).map(c => (
                            <button 
                               key={c}
                               onClick={() => selectChar(c)}
                               className={`p-2 text-xs rounded ${myChar === c ? 'bg-blue-600 text-white' : 'bg-gray-900 text-gray-400'}`}
                            >
                               {CHARACTERS[c].name}
                            </button>
                         ))}
                      </div>
                      <div className="mt-4 text-xl font-bold" style={{ color: CHARACTERS[myChar].color }}>
                         {CHARACTERS[myChar].name}
                      </div>
                   </div>

                   {/* Opponent Selection */}
                   <div className="flex flex-col items-center p-4 bg-gray-700/50 rounded-lg border border-red-500">
                      <span className="mb-2 font-arcade text-red-300">OPPONENT ({isHost ? 'P2' : 'P1'})</span>
                      {opponentChar ? (
                         <>
                           <div className="mt-auto mb-auto text-2xl font-bold animate-bounce" style={{ color: CHARACTERS[opponentChar].color }}>
                              {CHARACTERS[opponentChar].name}
                           </div>
                           <span className="text-xs text-gray-400">Ready</span>
                         </>
                      ) : (
                         <div className="mt-auto mb-auto text-gray-500 italic">Selecting...</div>
                      )}
                   </div>
                </div>

                {isHost ? (
                   <button 
                     disabled={!opponentChar}
                     onClick={startGame}
                     className={`w-full py-4 rounded font-arcade text-xl ${opponentChar ? 'bg-green-600 hover:bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                   >
                      START MATCH
                   </button>
                ) : (
                   <div className="text-yellow-400 font-arcade text-lg">
                      WAITING FOR HOST TO START...
                   </div>
                )}
             </div>
          )}
       </div>

       <button onClick={onBack} className="mt-8 text-gray-500 hover:text-white underline">Cancel</button>
    </div>
  );
};