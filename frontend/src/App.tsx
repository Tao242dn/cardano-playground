/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Resizable } from 're-resizable';

// Import webcontainer
import { getWebContainerInstance } from './webContainerInstance';

// Import hooks
import { useWallet } from './hooks/useWallet';

// Import execution functions
import { executeCode } from './execution/codeExecutor';

// Import copy functions
import { copyCode, copyWalletAddress } from './utils/copy';

// Import components
import Header from './components/Header';
import Toolbar from './components/Toolbar';
import CodeEditor from './components/CodeEditor';
import ConsoleOutput from './components/ConsoleOutput';
import Footer from './components/Footer';

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

  const [consoleOutput, setConsoleOutput] = useState<string>(''); 
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [executionStatus, setExecutionStatus] = useState<'success' | 'error' | null>(null);
  const [copySuccess, setCopySuccess] = useState<string>('');
  const [editorWidth, setEditorWidth] = useState<number>(window.innerWidth * 0.6);
  const webContainerInstanceRef = useRef<any>(null);

  // Use the custom hook
  const {
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
  } = useWallet();


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
            'package.json': {
              file: {
                contents: {
                  "type": "module",
                  "dependencies": {
                    "@meshsdk/core": "^1.7.11",
                  }
                }
              }
            }
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

  const handleExecuteCode = useCallback(async () => {
    setExecutionStatus(null);
    await executeCode(language, code, setConsoleOutput, setExecutionStatus);
  }, [language, code]);

  const handleCopyCode = useCallback(async () => {
    await copyCode(code, setCopySuccess);
  }, [code]);

  const handleCopyWalletAddress = useCallback(async () => {
    await copyWalletAddress(walletAddress, setCopySuccess);
  }, [walletAddress]);


  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 shadow-lg">

        {/* Top bar with wallet */}
        <Header
          connectedWallet={connectedWallet}
          walletAddress={walletAddress}
          walletBalance={walletBalance}
          showWalletList={showWalletList}
          availableWallets={availableWallets}
          walletDropdownRef={walletDropdownRef}
          connectWallet={connectWallet}
          disconnectWallet={disconnectWallet}
          shortenAddress={shortenAddress}
          setShowWalletList={setShowWalletList}
          handleCopyWalletAddress={handleCopyWalletAddress}
        />


        {/* Main toolbar */}
        <Toolbar
          language={language}
          setLanguage={setLanguage}
          setCode={setCode}
          handleExecuteCode={handleExecuteCode}
          handleCopyCode={handleCopyCode}
          isLoading={isLoading}
          setConsoleOutput={setConsoleOutput}
          setExecutionStatus={setExecutionStatus}
        />

      </header>


      {/* Body */}
      <main className="flex flex-1 h-[calc(100vh-8rem)] overflow-hidden">
        {/* Code Editor */}
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
          {/* Console Output */}
          <ConsoleOutput consoleOutput={consoleOutput} executionStatus={executionStatus} />
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
