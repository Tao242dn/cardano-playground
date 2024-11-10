import { useState, useEffect, useRef } from 'react';
import { BrowserWallet } from '@meshsdk/core';

interface Wallet {
  name: string;
  icon: string;
}

export function useWallet() {
  const [connectedWallet, setConnectedWallet] = useState<BrowserWallet | null>(null);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showWalletList, setShowWalletList] = useState<boolean>(false);
  const [availableWallets, setAvailableWallets] = useState<Wallet[]>([]);
  const walletDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch available wallets on mount
  useEffect(() => {
    const fetchWallets = async () => {
      const wallets = await BrowserWallet.getAvailableWallets();
      setAvailableWallets(wallets);
    };
    fetchWallets();
  }, []);

  // Click outside listener for wallet dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showWalletList &&
        walletDropdownRef.current &&
        !walletDropdownRef.current.contains(event.target as Node)
      ) {
        setShowWalletList(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showWalletList]);

  const connectWallet = async (walletName: string) => {
    try {
      if (!walletName) {
        throw new Error('No wallet name provided');
      }

      const wallet = await BrowserWallet.enable(walletName);
      if (!wallet) {
        throw new Error('Failed to enable wallet');
      }
      setConnectedWallet(wallet);

      const usedAddresses = await wallet.getRewardAddresses();
      if (!usedAddresses || usedAddresses.length === 0) {
        throw new Error('No addresses found');
      }

      const address = usedAddresses[0];
      setWalletAddress(address);

      const balance = await wallet.getBalance();
      if (!balance || balance.length === 0) {
        throw new Error('Failed to get balance');
      }

      const adaBalance = parseInt(balance[0].quantity) / 1_000_000;
      setWalletBalance(adaBalance);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to connect to wallet. Please try again.'
      );
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const disconnectWallet = () => {
    setConnectedWallet(null);
    setWalletAddress('');
    setWalletBalance(null);
  };

  const shortenAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 15)}...${address.slice(-5)}`;
  };

  return {
    connectedWallet,
    walletAddress,
    walletBalance,
    errorMessage,
    showWalletList,
    availableWallets,
    walletDropdownRef,
    connectWallet,
    disconnectWallet,
    shortenAddress,
    setShowWalletList,
  };
}
