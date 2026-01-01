"use client";

import { useState, useEffect } from "react";
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEventLogs } from "viem";
import {
  PENALTY_GAME_CONTRACT_ADDRESS,
  PENALTY_GAME_ABI,
} from "@/lib/contracts/penaltyGame";

export interface GameResult {
  won: boolean;
  chosenPosition: number;
  ballPosition: number;
  payout: bigint;
}

export function usePenaltyGame() {
  const [sequenceNumber, setSequenceNumber] = useState<bigint | null>(null);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // Read entropy fee
  const { data: entropyFee, refetch: refetchFee } = useReadContract({
    address: PENALTY_GAME_CONTRACT_ADDRESS,
    abi: PENALTY_GAME_ABI,
    functionName: "getEntropyFee",
  });

  // Read game data (for polling)
  const { data: gameData, refetch: refetchGame } = useReadContract({
    address: PENALTY_GAME_CONTRACT_ADDRESS,
    abi: PENALTY_GAME_ABI,
    functionName: "getGame",
    args: sequenceNumber ? [sequenceNumber] : undefined,
    query: {
      enabled: sequenceNumber !== null && isPolling,
    },
  });

  // Write contract
  const {
    writeContract,
    data: txHash,
    isPending,
    error,
    reset,
  } = useWriteContract();

  // Wait for transaction
  const { data: receipt, isLoading: isConfirming } =
    useWaitForTransactionReceipt({ hash: txHash });

  // Extract sequence number from receipt
  useEffect(() => {
    if (receipt) {
      try {
        const logs = parseEventLogs({
          abi: PENALTY_GAME_ABI,
          logs: receipt.logs,
          eventName: "GameStarted",
        });
        if (logs.length > 0) {
          setSequenceNumber(logs[0].args.sequenceNumber);
          setIsPolling(true);
        }
      } catch (e) {
        console.error("Failed to parse GameStarted event:", e);
      }
    }
  }, [receipt]);

  // Poll for game result
  useEffect(() => {
    if (!isPolling || !sequenceNumber) return;

    const interval = setInterval(() => {
      refetchGame();
    }, 2000);

    return () => clearInterval(interval);
  }, [isPolling, sequenceNumber, refetchGame]);

  // Check if game is resolved
  useEffect(() => {
    if (gameData && isPolling) {
      // gameData is [player, betAmount, chosenPosition, resolved, won, ballPosition]
      const [, betAmount, chosenPosition, resolved, won, ballPosition] = gameData as [
        string,
        bigint,
        number,
        boolean,
        boolean,
        number
      ];

      if (resolved) {
        const payout = won ? betAmount * BigInt(5) : BigInt(0);
        setGameResult({
          won,
          chosenPosition,
          ballPosition,
          payout,
        });
        setIsPolling(false);
      }
    }
  }, [gameData, isPolling]);

  const placeBet = (position: number, betAmount: bigint) => {
    if (!entropyFee) return;

    setGameResult(null);
    setSequenceNumber(null);
    setIsPolling(false);

    writeContract({
      address: PENALTY_GAME_CONTRACT_ADDRESS,
      abi: PENALTY_GAME_ABI,
      functionName: "placeBet",
      args: [position],
      value: betAmount + entropyFee,
    });
  };

  const resetGame = () => {
    reset();
    setSequenceNumber(null);
    setGameResult(null);
    setIsPolling(false);
  };

  return {
    placeBet,
    entropyFee,
    refetchFee,
    isPending,
    isConfirming,
    isWaitingForResult: isPolling && !gameResult,
    gameResult,
    error,
    reset: resetGame,
  };
}
