"use client";

import { useState, useEffect, useCallback } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useBalance, useSendTransaction } from "wagmi";
import { formatEther, parseEther } from "viem";

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

import { GoalBoard } from "./GoalBoard";
import { BetSelector } from "./BetSelector";
import { GameResult } from "./GameResult";
import { PlayerStats } from "./PlayerStats";
import { LoginButton } from "../auth/LoginButton";
import { usePenaltyGame } from "@/hooks/usePenaltyGame";
import { usePracticeGame } from "@/hooks/usePracticeGame";
import { cn } from "@/lib/utils";

type GameState = "idle" | "confirming" | "waiting" | "revealing" | "result";
type GameMode = "practice" | "real";

export function PenaltyGame() {
  const { ready, authenticated, exportWallet } = usePrivy();
  const { wallets } = useWallets();

  // Get the embedded wallet address from Privy
  const embeddedWallet = wallets.find((wallet) => wallet.walletClientType === "privy");
  const address = embeddedWallet?.address as `0x${string}` | undefined;

  const { data: balance, refetch: refetchBalance } = useBalance({ address });

  const [gameMode, setGameMode] = useState<GameMode>("practice");
  const [gameState, setGameState] = useState<GameState>("idle");
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [selectedBet, setSelectedBet] = useState<bigint | null>(null);
  const [copied, setCopied] = useState(false);

  // Wallet management state
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [showSendForm, setShowSendForm] = useState(false);
  const [sendTo, setSendTo] = useState("");
  const [sendAmount, setSendAmount] = useState("");

  // Send transaction hook
  const { sendTransaction, isPending: isSending, isSuccess: sendSuccess, reset: resetSend } = useSendTransaction();

  const copyAddress = useCallback(() => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [address]);

  const handleExportWallet = async () => {
    try {
      await exportWallet();
      setShowWalletMenu(false);
    } catch (e) {
      console.error("Failed to export wallet:", e);
    }
  };

  const handleSend = () => {
    if (!sendTo || !sendAmount) return;
    try {
      const value = parseEther(sendAmount);
      sendTransaction({ to: sendTo as `0x${string}`, value });
    } catch (e) {
      console.error("Failed to send:", e);
    }
  };

  // Reset send form on success
  useEffect(() => {
    if (sendSuccess) {
      setSendTo("");
      setSendAmount("");
      setShowSendForm(false);
      setShowWalletMenu(false);
      resetSend();
      refetchBalance();
    }
  }, [sendSuccess, resetSend, refetchBalance]);

  // Real game hook
  const realGame = usePenaltyGame();

  // Practice game hook (uses existing RandomNumberConsumer)
  const practiceGame = usePracticeGame();

  // Select active game based on mode
  const activeGame = gameMode === "practice" ? practiceGame : realGame;
  const entropyFee = activeGame.entropyFee;

  // Handle game state transitions
  useEffect(() => {
    if (activeGame.isPending || activeGame.isConfirming) {
      setGameState("confirming");
    } else if (activeGame.isWaitingForResult) {
      setGameState("waiting");
    }
  }, [activeGame.isPending, activeGame.isConfirming, activeGame.isWaitingForResult]);

  // Handle game result
  useEffect(() => {
    if (activeGame.gameResult) {
      setGameState("revealing");
      const timer = setTimeout(() => {
        setGameState("result");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [activeGame.gameResult]);

  const handlePlay = () => {
    if (selectedPosition === null) return;

    if (gameMode === "practice") {
      practiceGame.playGame(selectedPosition);
    } else {
      if (selectedBet === null) return;
      realGame.placeBet(selectedPosition, selectedBet);
    }
  };

  const handlePlayAgain = () => {
    setGameState("idle");
    setSelectedPosition(null);
    setSelectedBet(null);
    activeGame.reset();
  };

  const handleModeChange = (mode: GameMode) => {
    if (gameState !== "idle") return;
    setGameMode(mode);
    setSelectedPosition(null);
    setSelectedBet(null);
  };

  const totalCost =
    selectedBet && entropyFee ? selectedBet + entropyFee : null;

  const canPlayPractice =
    selectedPosition !== null &&
    entropyFee !== undefined &&
    balance?.value &&
    balance.value >= entropyFee &&
    gameState === "idle";

  const canPlayReal =
    selectedPosition !== null &&
    selectedBet !== null &&
    totalCost !== null &&
    balance?.value &&
    balance.value >= totalCost &&
    gameState === "idle";

  const canPlay = gameMode === "practice" ? canPlayPractice : canPlayReal;

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="text-center space-y-6 py-12">
        <div className="text-6xl">⚽</div>
        <h2 className="text-3xl font-bold text-white">Molandak Kickoff</h2>
        <p className="text-gray-400 max-w-md mx-auto">
          Dive to save the penalty and win up to 5x your bet! Login with email
          to start playing.
        </p>
        <LoginButton />
      </div>
    );
  }

  // Build game result for display
  const displayResult = activeGame.gameResult
    ? {
        won: activeGame.gameResult.won,
        chosenPosition: activeGame.gameResult.chosenPosition,
        ballPosition: activeGame.gameResult.ballPosition,
        payout: "payout" in activeGame.gameResult ? activeGame.gameResult.payout : BigInt(0),
      }
    : null;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header with balance */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Molandak Kickoff</h2>
          <p className="text-sm text-gray-400">
            {gameMode === "practice" ? "Practice Mode - No betting" : "Save the penalty, win 5x!"}
          </p>
        </div>
        <div className="text-right relative">
          <div className="text-sm text-gray-400">Balance</div>
          <div className="font-mono text-lg text-white">
            {balance ? formatEther(balance.value).slice(0, 8) : "0"} MON
          </div>
          {address && (
            <button
              onClick={() => setShowWalletMenu(!showWalletMenu)}
              className="font-mono text-xs text-gray-500 hover:text-purple-400 transition-colors cursor-pointer"
              title="Click to manage wallet"
            >
              {shortenAddress(address)} ▼
            </button>
          )}

          {/* Wallet dropdown menu */}
          {showWalletMenu && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
              <div className="p-3 border-b border-gray-700">
                <div className="text-xs text-gray-400 mb-1">Wallet Address</div>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-white bg-gray-900 px-2 py-1 rounded flex-1 overflow-hidden text-ellipsis">
                    {address}
                  </code>
                  <button
                    onClick={copyAddress}
                    className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-white"
                  >
                    {copied ? "✓" : "Copy"}
                  </button>
                </div>
              </div>

              {!showSendForm ? (
                <div className="p-2 space-y-1">
                  <button
                    onClick={() => setShowSendForm(true)}
                    className="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-700 rounded transition-colors"
                  >
                    📤 Send / Withdraw
                  </button>
                  <button
                    onClick={handleExportWallet}
                    className="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-700 rounded transition-colors"
                  >
                    🔑 Export Private Key
                  </button>
                  <button
                    onClick={() => setShowWalletMenu(false)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:bg-gray-700 rounded transition-colors"
                  >
                    ✕ Close
                  </button>
                </div>
              ) : (
                <div className="p-3 space-y-3">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Recipient Address</label>
                    <input
                      type="text"
                      value={sendTo}
                      onChange={(e) => setSendTo(e.target.value)}
                      placeholder="0x..."
                      className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Amount (MON)</label>
                    <input
                      type="text"
                      value={sendAmount}
                      onChange={(e) => setSendAmount(e.target.value)}
                      placeholder="0.0"
                      className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowSendForm(false)}
                      className="flex-1 px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSend}
                      disabled={!sendTo || !sendAmount || isSending}
                      className="flex-1 px-3 py-2 text-sm bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors"
                    >
                      {isSending ? "Sending..." : "Send"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 p-1 bg-gray-800 rounded-lg">
        <button
          onClick={() => handleModeChange("practice")}
          disabled={gameState !== "idle"}
          className={cn(
            "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
            gameMode === "practice"
              ? "bg-purple-600 text-white"
              : "text-gray-400 hover:text-white",
            gameState !== "idle" && "opacity-50 cursor-not-allowed"
          )}
        >
          Practice Mode
        </button>
        <button
          onClick={() => handleModeChange("real")}
          disabled={gameState !== "idle"}
          className={cn(
            "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
            gameMode === "real"
              ? "bg-green-600 text-white"
              : "text-gray-400 hover:text-white",
            gameState !== "idle" && "opacity-50 cursor-not-allowed"
          )}
        >
          Real Mode
        </button>
      </div>

      {/* Practice mode notice */}
      {gameMode === "practice" && (
        <div className="p-3 bg-purple-900/30 border border-purple-700 rounded-lg text-purple-300 text-sm">
          Practice mode uses Pyth VRF for real randomness. No betting - just pay the network fee to play!
        </div>
      )}

      {/* Real mode notice */}
      {gameMode === "real" && (
        <div className="p-3 bg-green-900/30 border border-green-700 rounded-lg text-green-300 text-sm">
          Real mode active! Select a position and bet amount, then click DIVE. Win 5x your bet if you save!
          {!realGame.entropyFee && (
            <span className="block mt-1 text-yellow-400">Loading contract data...</span>
          )}
        </div>
      )}

      {/* Result overlay */}
      {gameState === "result" && displayResult && (
        <GameResult
          won={displayResult.won}
          chosenPosition={displayResult.chosenPosition}
          ballPosition={displayResult.ballPosition}
          payout={displayResult.payout}
          onPlayAgain={handlePlayAgain}
        />
      )}

      {/* Game board - only show when not in result state */}
      {gameState !== "result" && (
        <>
          <GoalBoard
            selectedPosition={selectedPosition}
            onSelectPosition={setSelectedPosition}
            onDive={handlePlay}
            canDive={canPlay}
            ballPosition={displayResult?.ballPosition}
            isRevealing={gameState === "revealing"}
            disabled={gameState !== "idle"}
            statusText={
              gameState === "idle" ? undefined :
              gameState === "confirming" ? "Confirm in wallet..." :
              gameState === "waiting" ? "Ball is being kicked..." :
              "Result incoming!"
            }
            rightPanelExtra={
              gameMode === "real" ? (
                <BetSelector
                  selectedAmount={selectedBet}
                  onSelectAmount={setSelectedBet}
                  disabled={gameState !== "idle"}
                />
              ) : undefined
            }
          />

          {/* Cost breakdown */}
          {gameState === "idle" && (
            <div className="p-3 bg-gray-800/50 rounded-lg space-y-1">
              {gameMode === "real" && totalCost && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Bet Amount</span>
                    <span className="text-white">
                      {formatEther(selectedBet!)} MON
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Network Fee</span>
                    <span className="text-white">
                      {entropyFee ? formatEther(entropyFee) : "..."} MON
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold border-t border-gray-700 pt-1 mt-1">
                    <span className="text-gray-300">Total Cost</span>
                    <span className="text-white">{formatEther(totalCost)} MON</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-400">
                    <span>Potential Win (5x)</span>
                    <span>{formatEther(selectedBet! * BigInt(5))} MON</span>
                  </div>
                </>
              )}
              {gameMode === "practice" && entropyFee && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Network Fee (Pyth VRF)</span>
                  <span className="text-white">
                    {formatEther(entropyFee)} MON
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Error display */}
          {activeGame.error && (
            <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-sm">
              {activeGame.error.message}
            </div>
          )}
        </>
      )}

      {/* Player stats - only show in real mode */}
      {gameMode === "real" && <PlayerStats address={address} />}

      {/* Logout button */}
      <div className="flex justify-center pt-4">
        <LoginButton />
      </div>
    </div>
  );
}
