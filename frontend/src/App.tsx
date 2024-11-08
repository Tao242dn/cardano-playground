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
  const webContainerInstanceRef = useRef<any>(null);

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

  const connectWallet = async () => {
    try {
      const walletList = await BrowserWallet.getAvailableWallets();
      if (walletList.length > 0) {
        const walletName = walletList[0].name;
        const wallet = await BrowserWallet.enable(walletName);
        console.log(walletName)
        setConnectedWallet(wallet);

        const usedAddresses = await wallet.getRewardAddresses();
        const address = usedAddresses[0];
        console.log(address);
        setWalletAddress(address);

        const balanceHex = await wallet.getBalance();
        console.log(balanceHex[0].quantity)

        const adaBalance = parseInt(balanceHex[0].quantity) / 1_000_000;
        setWalletBalance(adaBalance);
      } else {
        alert('No browser wallets found. Please install a Cardano wallet extension.');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setErrorMessage('Failed to connect to wallet. Please try again.');
      setTimeout(() => setErrorMessage(''), 2000);
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
      <header className="bg-gray-800 border-b border-gray-700 py-4 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
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

            {/* Add Connect Wallet */}
            {connectedWallet ? (
              <div
                className="relative group"
                onClick={handleCopyWalletAddress}
              >
                <div className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg cursor-pointer transition-colors duration-200">
                  <i className="fas fa-wallet text-indigo-400"></i>
                  <div className="text-sm">
                    <div className="font-semibold text-white">
                      {shortenAddress(walletAddress)}
                    </div>
                    <div className="text-gray-300">{walletBalance?.toFixed(2)} ADA</div>
                  </div>
                </div>
                {/* Disconnect Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering the copy function
                    disconnectWallet();
                  }}
                  className="absolute top-0 right-0 mt-1 mr-1 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium 
                  transition-all duration-200 flex items-center space-x-2"
              >
                <i className="fas fa-wallet"></i>
                <span>Connect Wallet</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* {errorMessage && (
        <div className="p-4 bg-red-600 text-white">
          <p>{errorMessage}</p>
        </div>
      )} */}

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
