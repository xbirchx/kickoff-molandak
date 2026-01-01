"use client";

import { useState, useEffect } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain,
} from "wagmi";
import { formatEther, parseEventLogs } from "viem";
import { injected } from "wagmi/connectors";
import {
  RANDOM_NUMBER_CONTRACT_ADDRESS,
  RANDOM_NUMBER_ABI,
} from "@/lib/contracts/randomNumber";
import { monadTestnet } from "@/lib/wagmi";

export function RandomNumber() {
  const { address, isConnected, chain } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const isWrongNetwork = isConnected && chain?.id !== monadTestnet.id;

  const [sequenceNumber, setSequenceNumber] = useState<bigint | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [lookupSequence, setLookupSequence] = useState<string>("");

  // Read the fee
  const { data: fee } = useReadContract({
    address: RANDOM_NUMBER_CONTRACT_ADDRESS,
    abi: RANDOM_NUMBER_ABI,
    functionName: "getFee",
  });

  // Read last sequence number
  const { data: lastSeqNum, refetch: refetchLastSeq } = useReadContract({
    address: RANDOM_NUMBER_CONTRACT_ADDRESS,
    abi: RANDOM_NUMBER_ABI,
    functionName: "lastSequenceNumber",
  });

  // Read last random number
  const { data: lastRandom, refetch: refetchLastRandom } = useReadContract({
    address: RANDOM_NUMBER_CONTRACT_ADDRESS,
    abi: RANDOM_NUMBER_ABI,
    functionName: "lastRandomNumber",
  });

  // Lookup specific sequence
  const { data: lookupResult, refetch: refetchLookup } = useReadContract({
    address: RANDOM_NUMBER_CONTRACT_ADDRESS,
    abi: RANDOM_NUMBER_ABI,
    functionName: "randomNumbers",
    args: lookupSequence ? [BigInt(lookupSequence)] : undefined,
    query: {
      enabled: false,
    },
  });

  // Write contract
  const {
    writeContract,
    data: txHash,
    isPending: isWritePending,
    error: writeError,
  } = useWriteContract();

  // Wait for transaction
  const { data: receipt, isLoading: isConfirming } =
    useWaitForTransactionReceipt({
      hash: txHash,
    });

  // Poll for random number result
  const { data: randomResult, refetch: refetchRandom } = useReadContract({
    address: RANDOM_NUMBER_CONTRACT_ADDRESS,
    abi: RANDOM_NUMBER_ABI,
    functionName: "randomNumbers",
    args: sequenceNumber ? [sequenceNumber] : undefined,
    query: {
      enabled: sequenceNumber !== null,
    },
  });

  // Extract sequence number from receipt
  useEffect(() => {
    if (receipt) {
      const logs = parseEventLogs({
        abi: RANDOM_NUMBER_ABI,
        logs: receipt.logs,
        eventName: "RandomNumberRequested",
      });
      if (logs.length > 0) {
        setSequenceNumber(logs[0].args.sequenceNumber);
        setIsPolling(true);
      }
    }
  }, [receipt]);

  // Poll for result
  useEffect(() => {
    if (!isPolling || !sequenceNumber) return;

    const interval = setInterval(() => {
      refetchRandom();
    }, 2000);

    return () => clearInterval(interval);
  }, [isPolling, sequenceNumber, refetchRandom]);

  // Stop polling when we get a result
  useEffect(() => {
    if (
      randomResult &&
      randomResult !==
        "0x0000000000000000000000000000000000000000000000000000000000000000"
    ) {
      setIsPolling(false);
    }
  }, [randomResult]);

  const handleRequestRandom = () => {
    if (!fee) return;
    writeContract({
      address: RANDOM_NUMBER_CONTRACT_ADDRESS,
      abi: RANDOM_NUMBER_ABI,
      functionName: "requestRandomNumber",
      value: fee,
    });
  };

  const isLoading = isWritePending || isConfirming || isPolling;

  const hasResult =
    randomResult &&
    randomResult !==
      "0x0000000000000000000000000000000000000000000000000000000000000000";

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-xl">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
        Random Number Generator
      </h2>

      {!isConnected ? (
        <button
          onClick={() => connect({ connector: injected() })}
          className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
        >
          Connect Wallet
        </button>
      ) : isWrongNetwork ? (
        <div className="space-y-4">
          <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-lg text-center">
            <p className="font-medium mb-2">Wrong Network</p>
            <p className="text-sm">
              Please switch to Monad Testnet to continue
            </p>
          </div>
          <button
            onClick={() => switchChain({ chainId: monadTestnet.id })}
            disabled={isSwitching}
            className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
          >
            {isSwitching ? "Switching..." : "Switch to Monad Testnet"}
          </button>
          <button
            onClick={() => disconnect()}
            className="w-full py-2 px-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm transition-colors"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg space-y-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Connected:
            </div>
            <div className="font-mono text-xs text-gray-900 dark:text-white break-all">
              {address}
            </div>
          </div>

          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg space-y-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Contract:
            </div>
            <div className="font-mono text-xs text-gray-900 dark:text-white break-all">
              {RANDOM_NUMBER_CONTRACT_ADDRESS}
            </div>
          </div>

          {fee && (
            <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Fee:
              </span>
              <span className="font-mono text-sm text-gray-900 dark:text-white">
                {formatEther(fee)} MON
              </span>
            </div>
          )}

          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Last Sequence #:
              </span>
              <span className="font-mono text-sm text-gray-900 dark:text-white">
                {lastSeqNum?.toString() ?? "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Last Random:
              </span>
              <button
                onClick={() => {
                  refetchLastSeq();
                  refetchLastRandom();
                }}
                className="px-3 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-xs rounded transition-colors"
              >
                Refresh
              </button>
            </div>
            {lastRandom && lastRandom !== "0x0000000000000000000000000000000000000000000000000000000000000000" ? (
              <div className="text-xs text-green-600 dark:text-green-400 break-all">
                {lastRandom}
              </div>
            ) : (
              <div className="text-xs text-gray-500 dark:text-gray-500">
                No random number yet
              </div>
            )}
          </div>

          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg space-y-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Lookup Sequence:
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                value={lookupSequence}
                onChange={(e) => setLookupSequence(e.target.value)}
                placeholder="Enter sequence #"
                className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-mono text-gray-900 dark:text-white"
              />
              <button
                onClick={() => refetchLookup()}
                disabled={!lookupSequence}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 text-gray-900 dark:text-white text-sm rounded-lg transition-colors"
              >
                Lookup
              </button>
            </div>
            {lookupResult && lookupResult !== "0x0000000000000000000000000000000000000000000000000000000000000000" && (
              <div className="text-xs text-green-600 dark:text-green-400 break-all pt-2">
                Result: {lookupResult}
              </div>
            )}
            {lookupResult === "0x0000000000000000000000000000000000000000000000000000000000000000" && lookupSequence && (
              <div className="text-xs text-yellow-600 dark:text-yellow-400 pt-2">
                No result yet for this sequence
              </div>
            )}
          </div>

          <button
            onClick={handleRequestRandom}
            disabled={isLoading || !fee}
            className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
          >
            {isWritePending
              ? "Confirm in Wallet..."
              : isConfirming
                ? "Confirming..."
                : isPolling
                  ? "Waiting for Random Number..."
                  : "Request Random Number"}
          </button>

          {writeError && (
            <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
              {writeError.message.slice(0, 100)}
            </div>
          )}

          {sequenceNumber !== null && (
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Sequence #:
                </span>
                <span className="font-mono text-sm text-gray-900 dark:text-white">
                  {sequenceNumber.toString()}
                </span>
              </div>

              {hasResult && (
                <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Random Number (bytes32):
                  </div>
                  <div className="font-mono text-xs text-gray-900 dark:text-white break-all">
                    {randomResult}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 pt-2">
                    As uint256:
                  </div>
                  <div className="font-mono text-xs text-gray-900 dark:text-white break-all">
                    {BigInt(randomResult).toString()}
                  </div>
                </div>
              )}

              {isPolling && (
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                  <div className="animate-spin h-4 w-4 border-2 border-purple-600 border-t-transparent rounded-full"></div>
                  <span className="text-sm">Waiting for callback...</span>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => disconnect()}
            className="w-full py-2 px-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm transition-colors"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
