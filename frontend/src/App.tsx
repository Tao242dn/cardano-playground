/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from 'react';
import { Resizable } from 're-resizable';
import { getWebContainerInstance } from './webContainerInstance';
import CodeEditor from './components/CodeEditor';
import Footer from './components/Footer';
import { executeCode } from './execution/codeExecutor';
import { copyCode } from './utils/copyCode';
import examples from './data/examples';

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

  const handleLoadExample = (example: any) => {
    setCode(example.code);
    setLanguage(example.language);
    setConsoleOutput('');
    setExecutionStatus(null);
    sessionStorage.setItem('code', example.code);
    sessionStorage.setItem('language', example.language);
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
          </div>
        </div>
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
            {copySuccess}
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;
