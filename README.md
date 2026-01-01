# Molandak Kickoff

A penalty kick betting game on Monad Testnet. Save the penalty and win 5x your bet!

## How to Play

1. Login with your email (Privy creates a wallet for you)
2. Select a corner to dive to
3. Choose your bet amount (Real Mode) or play for free (Practice Mode)
4. Click DIVE and hope you save it!

## Tech Stack

- **Next.js 15** - React framework
- **Privy** - Email-based authentication with embedded wallets
- **Pyth Entropy (VRF)** - Verifiable random number generation for fair gameplay
- **wagmi / viem** - Ethereum interactions
- **Monad Testnet** - Fast, EVM-compatible L1

## Getting Started

```bash
npm install
npm run dev
```

Create a `.env.local` file with your Privy App ID:

```
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
```

## License

MIT
