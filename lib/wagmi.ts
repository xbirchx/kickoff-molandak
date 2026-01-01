import { http, createConfig, createStorage, cookieStorage } from "wagmi";
import { defineChain } from "viem";

export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: {
    name: "Monad",
    symbol: "MON",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://testnet-rpc.monad.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Monad Explorer",
      url: "https://testnet.monadvision.com",
    },
  },
  testnet: true,
});

// Export supported chains for Privy config
export const supportedChains = [monadTestnet] as const;

export const config = createConfig({
  chains: supportedChains,
  transports: {
    [monadTestnet.id]: http(),
  },
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
});
