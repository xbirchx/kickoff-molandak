"use client";

import { useReadContract } from "wagmi";
import { formatEther } from "viem";
import {
  PENALTY_GAME_CONTRACT_ADDRESS,
  PENALTY_GAME_ABI,
} from "@/lib/contracts/penaltyGame";

interface PlayerStatsProps {
  address?: `0x${string}`;
}

export function PlayerStats({ address }: PlayerStatsProps) {
  const { data: stats } = useReadContract({
    address: PENALTY_GAME_CONTRACT_ADDRESS,
    abi: PENALTY_GAME_ABI,
    functionName: "getPlayerStats",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  if (!address || !stats) {
    return null;
  }

  const [wins, losses, totalWon] = stats;
  const totalGames = wins + losses;
  const winRate = totalGames > BigInt(0) ? Number((wins * BigInt(100)) / totalGames) : 0;

  return (
    <div className="p-4 bg-gray-800/50 rounded-lg space-y-2">
      <h4 className="text-sm font-semibold text-gray-400">Your Stats</h4>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-green-400">{wins.toString()}</p>
          <p className="text-xs text-gray-500">Wins</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-red-400">{losses.toString()}</p>
          <p className="text-xs text-gray-500">Losses</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-purple-400">{winRate}%</p>
          <p className="text-xs text-gray-500">Win Rate</p>
        </div>
      </div>
      {totalWon > BigInt(0) && (
        <div className="text-center pt-2 border-t border-gray-700">
          <p className="text-sm text-gray-400">Total Won</p>
          <p className="text-lg font-bold text-green-400">
            {formatEther(totalWon)} MON
          </p>
        </div>
      )}
    </div>
  );
}
