/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from 'react';
import { getWebContainerInstance } from './webContainerInstance';
import CodeEditor from './components/CodeEditor';

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
                  "dependencies": {
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

  const stripAnsiCodes = (str: string): string => {
    // eslint-disable-next-line no-control-regex
    return str.replace(/\u001b\[\d+m/g, '');
  };

  const executeJavaScript = async (code: string) => {
    try {
      const webContainerInstance = webContainerInstanceRef.current;
      await webContainerInstance.fs.writeFile('index.js', code);
      const process = await webContainerInstance.spawn('node', ['index.js']);

      let output = '';
      process.output.pipeTo(
        new WritableStream({
          write(data) {
            const cleanData = stripAnsiCodes(data);
            output += cleanData;
            setConsoleOutput(output);
          }
        })
      );

      await process.exit;
    } catch (error) {
      const err = error as Error;
      setConsoleOutput('Execution Error: ' + err.message);
    }
  };

  const executeTypeScript = async (code: string) => {
    try {
      const webContainerInstance = webContainerInstanceRef.current;
      await webContainerInstance.fs.writeFile('index.ts', code);

      // Compile TypeScript
      const tscProcess = await webContainerInstance.spawn('npx', ['tsc', 'index.ts']);
      await tscProcess.exit;

      // Execute compiled JavaScript
      const nodeProcess = await webContainerInstance.spawn('node', ['index.js']);

      let output = '';
      nodeProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            const cleanData = stripAnsiCodes(data);
            output += cleanData;
            setConsoleOutput(output);
          }
        })
      );

      await nodeProcess.exit;
    } catch (error) {
      const err = error as Error;
      setConsoleOutput('Execution Error: ' + err.message);
    }
  };

  const executeCode = async () => {
    setConsoleOutput('');
    const webContainerInstance = webContainerInstanceRef.current;
    if (!webContainerInstance) {
      setConsoleOutput('WebContainer not initialized');
      return;
    }

    if (language === 'javascript') {
      await executeJavaScript(code);
    } else {
      await executeTypeScript(code);
    }
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
          onClick={executeCode}
          disabled={isLoading}
          className={`mt-4 ${isLoading
            ? 'bg-gray-500'
            : 'bg-blue-500 hover:bg-blue-700'
            } text-white font-bold py-2 px-4 rounded`}
        >
          {isLoading ? 'Initializing...' : 'Run Code'}
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
