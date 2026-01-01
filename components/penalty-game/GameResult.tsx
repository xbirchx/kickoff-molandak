"use client";

import { formatEther } from "viem";
import { cn } from "@/lib/utils";

interface GameResultProps {
  won: boolean;
  chosenPosition: number;
  ballPosition: number;
  payout: bigint;
  onPlayAgain: () => void;
}

const POSITION_NAMES = ["Far Left", "Left", "Center", "Right", "Far Right"];

export function GameResult({
  won,
  chosenPosition,
  ballPosition,
  payout,
  onPlayAgain,
}: GameResultProps) {
  return (
    <div
      className={cn(
        "p-6 rounded-xl text-center space-y-4",
        won
          ? "bg-green-900/30 border border-green-600"
          : "bg-red-900/30 border border-red-600"
      )}
    >
      <div className="text-5xl">
        {won ? "🎉" : "😢"}
      </div>

      <h3
        className={cn(
          "text-2xl font-bold",
          won ? "text-green-400" : "text-red-400"
        )}
      >
        {won ? "SAVED!" : "GOAL!"}
      </h3>

      <div className="text-gray-300 space-y-1">
        <p>
          You dove <span className="font-semibold text-purple-400">{POSITION_NAMES[chosenPosition]}</span>
        </p>
        <p>
          Ball went <span className="font-semibold text-yellow-400">{POSITION_NAMES[ballPosition]}</span>
        </p>
      </div>

      {won && payout > BigInt(0) && (
        <div className="py-2">
          <p className="text-sm text-gray-400">You won</p>
          <p className="text-3xl font-bold text-green-400">
            {formatEther(payout)} MON
          </p>
        </div>
      )}

      <button
        onClick={onPlayAgain}
        className={cn(
          "w-full py-3 rounded-lg font-semibold transition-colors",
          won
            ? "bg-green-600 hover:bg-green-700 text-white"
            : "bg-purple-600 hover:bg-purple-700 text-white"
        )}
      >
        Play Again
      </button>
    </div>
  );
}
