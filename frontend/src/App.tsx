/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef} from 'react';
import { getWebContainerInstance } from './webContainerInstance';
import CodeEditor from './components/CodeEditor';
import { executeCode } from './execution/codeExecutor';

function App() {
  const [language, setLanguage] = useState<'javascript' | 'typescript'>('typescript');
  const [code, setCode] = useState<string>('');
  const [consoleOutput, setConsoleOutput] = useState<string>(''); // State for console output
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const webContainerInstanceRef = useRef<any>(null);

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
            'tsconfig.json': {
              file: {
                contents: `{
                  "compilerOptions": {
                    "target": "es2020",
                    "module": "commonjs",
                    "strict": true,
                    "esModuleInterop": true,
                    "skipLibCheck": true,
                    "forceConsistentCasingInFileNames": true
                  }
                }`,
              },
            },
            'package.json': {
              file: {
                contents: `{
                  "name": "code-runner",
                  "type": "commonjs",
                  "devDependencies": {
                    "typescript": "^5.0.0" 
                  }
                }`,
              },
            },
          };

          await webContainerInstance.mount(files);
          console.log('Files mounted successfully');

          // Install dependencies
          const installProcess = await webContainerInstance.spawn('npm', ['install']);
          await installProcess.exit;
          console.log('Dependencies installed successfully');
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
    await executeCode(language, code, setConsoleOutput);
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

        <button
          onClick={handleExecuteCode}
          disabled={isLoading}
          className={`mt-4 ${isLoading
            ? 'bg-gray-500'
            : 'bg-blue-500 hover:bg-blue-700'
            } text-white font-bold py-2 px-4 rounded`}
        >
          {isLoading ? 'Loading...' : 'Run Code'}
        </button>

        <div className="mt-6 bg-gray-800 text-green-400 p-4 rounded-md">
          <h3 className="text-lg font-semibold mb-2">Console Output</h3>
          <pre className="whitespace-pre-wrap">{consoleOutput}</pre>
        </div>
      </div>
    </div>
  );
}

export default App;
