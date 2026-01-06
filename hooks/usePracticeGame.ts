"use client";

import { useState, useCallback } from "react";

export interface PracticeGameResult {
  won: boolean;
  chosenPosition: number;
  ballPosition: number;
}

const NUM_POSITIONS = 5;

export function usePracticeGame() {
  const [gameResult, setGameResult] = useState<PracticeGameResult | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playGame = useCallback((position: number) => {
    setGameResult(null);
    setIsPlaying(true);

    // Simulate a brief delay for the "kick" animation
    setTimeout(() => {
      // Generate random ball position using crypto for better randomness
      const randomArray = new Uint32Array(1);
      crypto.getRandomValues(randomArray);
      const ballPosition = randomArray[0] % NUM_POSITIONS;

      setGameResult({
        won: position === ballPosition,
        chosenPosition: position,
        ballPosition,
      });
      setIsPlaying(false);
    }, 1500);
  }, []);

  const resetGame = useCallback(() => {
    setGameResult(null);
    setIsPlaying(false);
  }, []);

  return {
    playGame,
    entropyFee: undefined, // No fee for practice mode
    refetchFee: () => {},
    isPending: false,
    isConfirming: false,
    isWaitingForResult: isPlaying,
    gameResult,
    error: null,
    reset: resetGame,
  };
}
