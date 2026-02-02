// Infrastructure - Wallet utilities
export interface WalletShape {
  dinar?: number;
  usdMinor?: number;
  txCount?: number;
  [key: string]: any;
}

export function formatWallet(wallet?: WalletShape | null) {
  const dinar = wallet?.dinar ?? 0;
  const usdMinor = wallet?.usdMinor ?? 0;
  const usd = Number((usdMinor / 100).toFixed(2));
  return {
    ...wallet,
    dinar,
    usdMinor,
    usd,
  };
}

