"use client";

import { usePrivy } from "@privy-io/react-auth";

export function LoginButton() {
  const { ready, authenticated, login, logout, user } = usePrivy();

  if (!ready) {
    return (
      <div className="h-10 w-32 bg-gray-700 rounded-lg animate-pulse" />
    );
  }

  if (authenticated) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-400 truncate max-w-[200px]">
          {user?.email?.address}
        </span>
        <button
          onClick={logout}
          className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={login}
      className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
    >
      Login with Email
    </button>
  );
}
