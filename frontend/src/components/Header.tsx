/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/Header.tsx

import React from 'react';
import { BrowserWallet } from '@meshsdk/core';

interface HeaderProps {
    connectedWallet: BrowserWallet | null;
    walletAddress: string;
    walletBalance: number | null;
    showWalletList: boolean;
    availableWallets: any[];
    walletDropdownRef: React.RefObject<HTMLDivElement>;
    connectWallet: (walletName: string) => Promise<void>;
    disconnectWallet: () => void;
    shortenAddress: (address: string) => string;
    setShowWalletList: React.Dispatch<React.SetStateAction<boolean>>;
    handleCopyWalletAddress: () => Promise<void>;
}

const Header: React.FC<HeaderProps> = ({
    connectedWallet,
    walletAddress,
    walletBalance,
    showWalletList,
    availableWallets,
    walletDropdownRef,
    connectWallet,
    disconnectWallet,
    shortenAddress,
    setShowWalletList,
    handleCopyWalletAddress,
}) => {
    return (
        <>
            {/* Top bar with wallet */}
            <div className="border-b border-gray-700">
                <div className="max-w-7xl mx-auto px-6 py-2">
                    <div className="flex justify-end">
                        {/* Wallet Connection */}
                        {connectedWallet ? (
                            <div className="flex items-center space-x-3">
                                <div
                                    onClick={handleCopyWalletAddress}
                                    className="flex items-center space-x-3 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg cursor-pointer transition-all duration-200"
                                >
                                    <i className="fas fa-wallet text-indigo-400"></i>
                                    <div className="flex flex-col">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm font-medium text-gray-300">
                                                {shortenAddress(walletAddress)}
                                            </span>
                                            <i className="fas fa-copy text-xs text-gray-400"></i>
                                        </div>
                                        <span className="text-sm text-indigo-400">
                                            {walletBalance?.toFixed(2)} ADA
                                        </span>
                                    </div>
                                </div>

                                {/* Disconnect Button */}
                                <button
                                    onClick={disconnectWallet}
                                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
                                >
                                    <i className="fas fa-sign-out-alt"></i>
                                    <span>Disconnect Wallet</span>
                                </button>
                            </div>
                        ) : (
                            <div className="relative">
                                <button
                                    onClick={() => setShowWalletList(!showWalletList)}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
                                >
                                    <i className="fas fa-wallet"></i>
                                    <span>Connect Wallet</span>
                                </button>

                                {/* Wallet List Dropdown */}
                                {showWalletList && (
                                    <div
                                        ref={walletDropdownRef}
                                        className="absolute top-14 right-5 bg-gray-800 text-white rounded-lg w-64 p-4 shadow-lg"
                                    >
                                        <h2 className="text-lg text-center font-bold mb-2">Connect Wallet</h2>
                                        <p className="text-sm text-center text-cyan-400 mb-4">
                                            List of wallets installed on device
                                        </p>
                                        {availableWallets.map((wallet) => (
                                            <button
                                                key={wallet.name}
                                                onClick={() => connectWallet(wallet.name)}
                                                className="flex items-center w-full px-3 py-2 rounded-lg transition-colors hover:bg-gray-700"
                                            >
                                                <img
                                                    src={wallet.icon}
                                                    alt={`${wallet.name} logo`}
                                                    className="w-6 h-6 mr-3"
                                                />
                                                {wallet.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Header;
