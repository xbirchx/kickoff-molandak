import { PenaltyGame } from "@/components/penalty-game/PenaltyGame";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <main className="container mx-auto px-4 py-8">
        <PenaltyGame />

        <div className="mt-12 text-center text-sm text-gray-500">
          <p>Powered by Pyth Entropy on Monad Testnet</p>
        </div>
      </main>
    </div>
  );
}
