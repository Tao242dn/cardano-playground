/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from 'react';
import { BrowserWallet } from '@meshsdk/core';
import { Resizable } from 're-resizable';
import { getWebContainerInstance } from './webContainerInstance';
import CodeEditor from './components/CodeEditor';
import Footer from './components/Footer';
import { executeCode } from './execution/codeExecutor';
import { copyCode, copyWalletAddress } from './utils/copy';
import examples from './data/examples';

// Define global if necessary
if (typeof global === 'undefined') {
  window.global = window;
}

function App() {
  const [language, setLanguage] = useState<'javascript' | 'typescript'>(() => {
    try {
      const savedLanguage = sessionStorage.getItem('language');
      if (savedLanguage === 'javascript' || savedLanguage === 'typescript') {
        return savedLanguage;
      }
    } catch (error) {
      console.error('Error reading language from sessionStorage:', error);
    }
    return 'typescript';
  });

  const [code, setCode] = useState<string>(() => {
    const savedCode = sessionStorage.getItem('code');
    return savedCode !== null ? savedCode : '';
  });

  const [consoleOutput, setConsoleOutput] = useState<string>(''); // State for console output
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [executionStatus, setExecutionStatus] = useState<'success' | 'error' | null>(null);
  const [copySuccess, setCopySuccess] = useState<string>('');
  const [editorWidth, setEditorWidth] = useState<number>(window.innerWidth * 0.6);
  const [connectedWallet, setConnectedWallet] = useState<BrowserWallet | null>(null);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showWalletList, setShowWalletList] = useState<boolean>(false);
  const [availableWallets, setAvailableWallets] = useState<any[]>([]);
  const webContainerInstanceRef = useRef<any>(null);
  const walletDropdownRef = useRef<HTMLDivElement>(null);

  // Add this effect to fetch available wallets when component mounts
  useEffect(() => {
    const fetchWallets = async () => {
      const wallets = await BrowserWallet.getAvailableWallets();
      setAvailableWallets(wallets);
    };
    fetchWallets();
  }, []);

  // Modify the click outside listener
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

  // Debounced save of code to SessionStorage
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      sessionStorage.setItem('code', code);
    }, 500); // Adjust the delay as needed

    return () => {
      clearTimeout(timeoutId);
    };
  }, [code]);

  // Save language to SessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem('language', language);
  }, [language]);

  // Initialize WebContainer
  useEffect(() => {
    let isMounted = true;

    getWebContainerInstance()
      .then(async (webContainerInstance) => {
        if (!isMounted) return;

        webContainerInstanceRef.current = webContainerInstance;
        console.log('WebContainer booted successfully');

        // Check if files are already mounted to avoid remounting on HMR
        const filesExist = await webContainerInstance.fs.readdir('/');
        if (!filesExist.includes('index.js')) {
          // Setup initial files
          const files = {
            'index.js': {
              file: {
                contents: '',
              },
            },
          };

          await webContainerInstance.mount(files);
          console.log('Files mounted successfully');
        } else {
          console.log('Files already mounted');
        }

        setIsLoading(false);
      })
      .catch((error) => {
        console.error('WebContainer initialization error:', error);
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleExecuteCode = async () => {
    setExecutionStatus(null);
    await executeCode(language, code, setConsoleOutput, setExecutionStatus);
  };

  const handleCopyCode = async () => {
    await copyCode(code, setCopySuccess);
  };

  const handleCopyWalletAddress = async () => {
    await copyWalletAddress(walletAddress, setCopySuccess);
  };

  const handleLoadExample = (example: any) => {
    setCode(example.code);
    setLanguage(example.language);
    setConsoleOutput('');
    setExecutionStatus(null);
    sessionStorage.setItem('code', example.code);
    sessionStorage.setItem('language', example.language);
  };

  const connectWallet = async (walletName: string) => {
    try {
      if (!walletName) {
        throw new Error('No wallet name provided');
      }

      console.log('Connecting to wallet:', walletName);

      const wallet = await BrowserWallet.enable(walletName);
      if (!wallet) {
        throw new Error('Failed to enable wallet');
      }

      console.log('Wallet enabled:', wallet);
      setConnectedWallet(wallet);

      const usedAddresses = await wallet.getRewardAddresses();
      if (!usedAddresses || usedAddresses.length === 0) {
        throw new Error('No addresses found');
      }

      const address = usedAddresses[0];
      console.log('Wallet address:', address);
      setWalletAddress(address);

      const balance = await wallet.getBalance();
      if (!balance || balance.length === 0) {
        throw new Error('Failed to get balance');
      }

      console.log('Balance hex:', balance[0].quantity);
      const adaBalance = parseInt(balance[0].quantity) / 1_000_000;
      setWalletBalance(adaBalance);

    } catch (error) {
      console.error('Error connecting wallet:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to connect to wallet. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  }
  const disconnectWallet = () => {
    setConnectedWallet(null);
    setWalletAddress('');
    setWalletBalance(null);
  };

  const shortenAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 15)}...${address.slice(-5)}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 shadow-lg">

        {/* Top bar with wallet */}
        <div className='border-b border-gray-700'>
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
                        <span className="text-sm font-medium text-gray-300">{shortenAddress(walletAddress)}</span>
                        <i className="fas fa-copy text-xs text-gray-400"></i>
                      </div>
                      <span className="text-sm text-indigo-400">{walletBalance?.toFixed(2)} ADA</span>
                    </div>
                  </div>

                  {/* Disconnect Dropdown */}
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
                  {/* {showWalletList && (
                    <div
                      ref={walletDropdownRef}
                      className="absolute right-0 mt-2 w-64 bg-slate-600 rounded-lg shadow-lg transition-transform transform scale-95 opacity-100 duration-200 ease-in-out z-50"
                    >
                      {availableWallets.map((wallet) => (
                        <button
                          key={wallet.name}
                          onClick={(e) => {
                            e.stopPropagation();
                            connectWallet(wallet.name);
                            setShowWalletList(false);
                          }}
                          className="w-full px-4 py-3 text-center hover:bg-gray-500 flex items-center space-x-3"
                        >
                          <img
                            src={wallet.icon}
                            alt={wallet.name}
                            className="w-6 h-6 rounded-full"
                          />
                          <span className="text-sm font-bold text-gray-200">{wallet.name}</span>
                        </button>
                      ))}
                    </div>
                  )} */}

                  {showWalletList && (
                    <div ref={walletDropdownRef} className="absolute top-14 right-5 bg-gray-800 text-white rounded-lg w-64 p-4 shadow-lg">
                      <h2 className="text-lg text-center font-bold mb-2">Connect Wallet</h2>
                      <p className="text-sm text-center text-cyan-400 mb-4">List of wallets installed on device</p>
                      {availableWallets.map((wallet) => (
                        <button
                          key={wallet.name}
                          onClick={() => connectWallet(wallet.name)}
                          className={`flex items-center w-full px-3 py-2 rounded-lg transition-colors ${connectedWallet === wallet ? "bg-gray-800" : "hover:bg-gray-700"}`}
                        >
                          <img src={wallet.icon} alt={`${wallet.name} logo`} className="w-6 h-6 mr-3 " />
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


        {/* Main toolbar */}
        <div className='max-w-7xl mx-auto px-6 py-4'>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'javascript' | 'typescript')}
                className="bg-gray-700 text-gray-100 px-4 py-2 rounded-lg border border-gray-600 
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     transition-all duration-200 cursor-pointer hover:bg-gray-650"
              >
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
              </select>

              <select
                defaultValue=""
                onChange={(e) => {
                  const selectedExample = examples.find((ex) => ex.title === e.target.value);
                  if (selectedExample) {
                    handleLoadExample(selectedExample);
                  }
                }}
                className="bg-gray-700 text-gray-100 px-4 py-2 rounded-lg border border-gray-600 
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     transition-all duration-200 cursor-pointer hover:bg-gray-650"
              >
                <option value="" disabled>
                  Load Example
                </option>
                {examples.map((example) => (
                  <option key={example.title} value={example.title}>
                    {example.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleExecuteCode}
                disabled={isLoading}
                className={`${isLoading ? 'bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'
                  } text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2`}
              >
                <i className="fas fa-play"></i>
                <span>{isLoading ? 'Running...' : 'Run'}</span>
              </button>

              <button
                onClick={handleCopyCode}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium 
                     transition-all duration-200 flex items-center space-x-2"
              >
                <i className="fas fa-copy"></i>
                <span>Copy</span>
              </button>

              <button
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium 
                     transition-all duration-200 flex items-center space-x-2"
              >
                <i className="fas fa-cog"></i>
                <span>Settings</span>
              </button>

            </div>
          </div>
        </div>
        {/* Main toolbar */}
      </header>


      {/* Body */}
      <main className="flex flex-1 h-[calc(100vh-8rem)] overflow-hidden">
        <Resizable
          size={{ width: editorWidth, height: "100%" }}
          onResizeStop={(_e, _direction, _ref, d) => {
            setEditorWidth(editorWidth + d.width);
          }}
          minWidth={window.innerWidth * 0.3}
          maxWidth={window.innerWidth * 0.8}
          enable={{ right: true }}
          className="h-full"
        >
          <div className='flex-1 h-full bg-gray-800 p-4'>
            <div className='h-full rounded-lg bg-gray-900 overflow-hidden'>
              <CodeEditor
                value={code}
                onChange={setCode}
                language={language}
                theme="vs-dark"
              />
            </div>
          </div>
        </Resizable>

        <div className="flex-1 bg-gray-800 p-4 overflow-hidden">
          <div
            className={`h-full rounded-lg p-4 transition-all duration-200 ${executionStatus === 'success'
              ? 'bg-gray-900'
              : executionStatus === 'error'
                ? 'bg-red-900/20'
                : 'bg-gray-900'
              }`}
          >
            <h3 className="text-lg font-semibold mb-2 flex items-center">
              <i className="fas fa-terminal mr-2"></i>
              Console Output
            </h3>
            <pre className="whitespace-pre-wrap font-mono text-sm">{consoleOutput}</pre>
          </div>
        </div>
      </main>

      {copySuccess && (
        <div className="fixed bottom-4 right-4 animate-fade-in animate-slide-in-from-bottom">
          <div className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium">
            <p>
              <i className="fas fa-check mr-2"></i>{copySuccess}
            </p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="fixed bottom-4 right-4 animate-fade-in animate-slide-in-from-bottom">
          <div className="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium">
            <p>
              <i className="fas fa-exclamation-triangle mr-2"></i>{errorMessage}
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;
