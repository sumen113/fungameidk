import React, { useState } from "react";
import { GameMode, CharacterType } from "./types";
import { MainMenu } from "./components/MainMenu";
import { CharacterSelect } from "./components/CharacterSelect";
import { OnlineSetup } from "./components/OnlineSetup";
import { GameLoop } from "./components/GameLoop";

enum AppScreen {
  MENU = "MENU",
  SELECT = "SELECT",
  ONLINE_LOBBY = "ONLINE_LOBBY",
  GAME = "GAME",
}

const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>(AppScreen.MENU);
  const [mode, setMode] = useState<GameMode>(GameMode.MENU);
  const [p1Char, setP1Char] = useState<CharacterType>(CharacterType.BOLT);
  const [p2Char, setP2Char] = useState<CharacterType>(CharacterType.BOLT);

  const [networkConn, setNetworkConn] = useState<any>(null);
  const [isHost, setIsHost] = useState<boolean>(false);

  const handleModeSelect = (selectedMode: GameMode) => {
    setMode(selectedMode);
    if (selectedMode === GameMode.ONLINE) {
      setScreen(AppScreen.ONLINE_LOBBY);
    } else {
      setScreen(AppScreen.SELECT);
    }
  };

  const handleCharSelect = (p1: CharacterType, p2: CharacterType) => {
    setP1Char(p1);
    setP2Char(p2);
    setScreen(AppScreen.GAME);
  };

  const handleOnlineStart = (
    host: boolean,
    conn: any,
    myC: CharacterType,
    oppC: CharacterType
  ) => {
    setIsHost(host);
    setNetworkConn(conn);
    if (host) {
      setP1Char(myC);
      setP2Char(oppC);
    } else {
      setP1Char(oppC);
      setP2Char(myC);
    }
    setScreen(AppScreen.GAME);
  };

  const handleExitGame = () => {
    if (networkConn) {
      networkConn.close();
      setNetworkConn(null);
    }
    setScreen(AppScreen.MENU);
    setMode(GameMode.MENU);
  };

  const handleBackToMenu = () => {
    setScreen(AppScreen.MENU);
  };

  return (
    <>
      {screen === AppScreen.MENU && (
        <MainMenu onSelectMode={handleModeSelect} />
      )}

      {screen === AppScreen.SELECT && (
        <CharacterSelect
          isPvP={mode === GameMode.PVP}
          onStart={handleCharSelect}
          onBack={handleBackToMenu}
        />
      )}

      {screen === AppScreen.ONLINE_LOBBY && (
        <OnlineSetup
          onGameStart={handleOnlineStart}
          onBack={handleBackToMenu}
        />
      )}

      {screen === AppScreen.GAME && (
        <GameLoop
          mode={mode}
          p1Char={p1Char}
          p2Char={p2Char}
          onExit={handleExitGame}
          networkConn={networkConn}
          isHost={isHost}
        />
      )}
    </>
  );
};

export default App;
