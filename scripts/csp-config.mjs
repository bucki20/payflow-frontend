export function getCspConnectSources(env = process.env) {
  function httpOrigin(value) {
    if (!value?.trim()) return null;
    try {
      const url = new URL(value.trim());
      return ["http:", "https:", "ws:", "wss:"].includes(url.protocol)
        ? url.origin
        : null;
    } catch {
      return null;
    }
  }

  const sources = [
    env.NEXT_PUBLIC_SOROBAN_RPC_URL ?? "https://soroban-testnet.stellar.org",
    env.NEXT_PUBLIC_HORIZON_URL ?? "https://horizon-testnet.stellar.org",
    env.NEXT_PUBLIC_API_URL === undefined
      ? "http://localhost:8080"
      : env.NEXT_PUBLIC_API_URL,
    ...(env.NEXT_PUBLIC_STELLAR_TOML_ORIGINS ?? "").split(","),
    "https://relay.walletconnect.com",
    "wss://relay.walletconnect.com",
    "https://api.web3modal.org",
    "https://pulse.walletconnect.com",
  ]
    .map(httpOrigin)
    .filter(Boolean);

  return [...new Set(sources)];
}
