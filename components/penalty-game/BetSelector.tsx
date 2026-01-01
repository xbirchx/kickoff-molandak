"use client";

import { cn } from "@/lib/utils";

interface BetSelectorProps {
  selectedAmount: bigint | null;
  onSelectAmount: (amount: bigint) => void;
  disabled?: boolean;
}

const BET_OPTIONS = [
  { value: BigInt("10000000000000000"), label: "0.01 MON" }, // 0.01 ether
  { value: BigInt("50000000000000000"), label: "0.05 MON" }, // 0.05 ether
  { value: BigInt("100000000000000000"), label: "0.1 MON" }, // 0.1 ether
];

export function BetSelector({
  selectedAmount,
  onSelectAmount,
  disabled,
}: BetSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm text-gray-400">Select Bet Amount</label>
      <div className="grid grid-cols-3 gap-2">
        {BET_OPTIONS.map((option) => (
          <button
            key={option.label}
            onClick={() => onSelectAmount(option.value)}
            disabled={disabled}
            className={cn(
              "py-3 px-4 rounded-lg font-medium transition-all",
              "border-2",
              selectedAmount === option.value
                ? "border-purple-500 bg-purple-500/20 text-purple-300"
                : "border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
