"use client";

import { useState, useEffect } from "react";
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEventLogs } from "viem";
import {
  RANDOM_NUMBER_CONTRACT_ADDRESS,
  RANDOM_NUMBER_ABI,
} from "@/lib/contracts/randomNumber";

export interface PracticeGameResult {
  won: boolean;
  chosenPosition: number;
  ballPosition: number;
}

const NUM_POSITIONS = 5;

export function usePracticeGame() {
  const [sequenceNumber, setSequenceNumber] = useState<bigint | null>(null);
  const [chosenPosition, setChosenPosition] = useState<number | null>(null);
  const [gameResult, setGameResult] = useState<PracticeGameResult | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // Read entropy fee
  const { data: entropyFee, refetch: refetchFee } = useReadContract({
    address: RANDOM_NUMBER_CONTRACT_ADDRESS,
    abi: RANDOM_NUMBER_ABI,
    functionName: "getFee",
  });

  // Read random number result
  const { data: randomNumber, refetch: refetchRandom } = useReadContract({
    address: RANDOM_NUMBER_CONTRACT_ADDRESS,
    abi: RANDOM_NUMBER_ABI,
    functionName: "randomNumbers",
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
          abi: RANDOM_NUMBER_ABI,
          logs: receipt.logs,
          eventName: "RandomNumberRequested",
        });
        if (logs.length > 0) {
          setSequenceNumber(logs[0].args.sequenceNumber);
          setIsPolling(true);
        }
      } catch (e) {
        console.error("Failed to parse RandomNumberRequested event:", e);
      }
    }
  }, [receipt]);

  // Poll for random number result
  useEffect(() => {
    if (!isPolling || !sequenceNumber) return;

    const interval = setInterval(() => {
      refetchRandom();
    }, 2000);

    return () => clearInterval(interval);
  }, [isPolling, sequenceNumber, refetchRandom]);

  // Check if random number is ready and calculate result
  useEffect(() => {
    if (
      randomNumber &&
      randomNumber !== "0x0000000000000000000000000000000000000000000000000000000000000000" &&
      chosenPosition !== null &&
      isPolling
    ) {
      // Calculate ball position from random number
      const ballPosition = Number(BigInt(randomNumber) % BigInt(NUM_POSITIONS));

      setGameResult({
        won: chosenPosition === ballPosition,
        chosenPosition,
        ballPosition,
      });
      setIsPolling(false);
    }
  }, [randomNumber, chosenPosition, isPolling]);

  const playGame = (position: number) => {
    if (!entropyFee) return;

    setGameResult(null);
    setSequenceNumber(null);
    setChosenPosition(position);

    writeContract({
      address: RANDOM_NUMBER_CONTRACT_ADDRESS,
      abi: RANDOM_NUMBER_ABI,
      functionName: "requestRandomNumber",
      value: entropyFee,
    });
  };

  const resetGame = () => {
    reset();
    setSequenceNumber(null);
    setChosenPosition(null);
    setGameResult(null);
    setIsPolling(false);
  };

  return {
    playGame,
    entropyFee,
    refetchFee,
    isPending,
    isConfirming,
    isWaitingForResult: isPolling,
    gameResult,
    error,
    reset: resetGame,
  };
}
