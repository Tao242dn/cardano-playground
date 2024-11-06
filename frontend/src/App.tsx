/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from 'react';
import { getWebContainerInstance } from './webContainerInstance';
import CodeEditor from './components/CodeEditor';
import { executeCode } from './execution/codeExecutor';
import { copyCode } from './utils/copyCode';

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

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center space-x-4 mb-6">
          <label
            htmlFor="language-select"
            className="text-gray-300 font-medium"
          >
            Choose Language:
          </label>
          <select
            id="language-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'javascript' | 'typescript')}
            className="bg-gray-800 text-gray-100 px-4 py-2 rounded-md border border-gray-700 
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                   transition-all duration-200 cursor-pointer hover:bg-gray-750"
          >
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
          </select>
        </div>

        <CodeEditor
          value={code}
          onChange={setCode}
          language={language}
          theme="vs-dark"
        />

        <div className="flex space-x-4">
          <button
            onClick={handleExecuteCode}
            disabled={isLoading}
            className={`mt-4 ${isLoading ? 'bg-gray-500' : 'bg-blue-500 hover:bg-blue-700'
              } text-white font-bold py-2 px-4 rounded`}
          >
            {isLoading ? 'Run...' : (
              <div>
                Run <i className="fa-solid fa-gears"></i>
              </div>
            )}
          </button>
          <button
            onClick={handleCopyCode}
            className="mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Copy <i className="fa-solid fa-copy"></i>
          </button>
        </div>
        {copySuccess && <p className="text-green-500 mt-2">{copySuccess}</p>}

        <div
          className={`mt-6 p-4 rounded-md transition-all duration-200 ${executionStatus === 'success'
            ? 'bg-gray-800 text-gray-200'
            : executionStatus === 'error'
              ? 'bg-red-400 text-red-800'
              : 'bg-gray-800 text-gray-200'
            }`}
        >
          <h3 className="text-lg font-semibold mb-2">Console Output</h3>
          <pre className="whitespace-pre-wrap">{consoleOutput}</pre>
        </div>
      </div>
    </div>
  );
}

export default App;
