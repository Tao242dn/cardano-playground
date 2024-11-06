import { getWebContainerInstance } from '../webContainerInstance';
import { stripAnsiCodes } from '../utils/stringUtils';
import ts from 'typescript';

// Compile TypeScript code to JavaScript
const compileTypeScript = (code: string) => {
  try {
    const result = ts.transpileModule(code, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        noImplicitAny: false,
        removeComments: true
      },
    });
    return result.outputText;
  } catch (error) {
    return (error as Error).message;
  }
};

// Function to execute JavaScript code
const executeJavaScript = async (
  code: string,
  setConsoleOutput: (output: string) => void,
  setExecutionStatus: (status: 'success' | 'error' | null) => void
) => {
  try {
    const webContainerInstance = await getWebContainerInstance();
    await webContainerInstance.fs.writeFile('index.js', code);
    const process = await webContainerInstance.spawn('node', ['index.js']);

    let output = '';
    process.output.pipeTo(
      new WritableStream({
        write(data) {
          const cleanData = stripAnsiCodes(data);
          output += cleanData;
          setConsoleOutput(output);
        },
      })
    );

    await process.exit;
    setExecutionStatus('success');
  } catch (error) {
    const err = error as Error;
    setConsoleOutput('Execution Error: ' + err.message);
    setExecutionStatus('error');
  }
};

// Function to execute code based on the selected language
export const executeCode = async (
  language: 'javascript' | 'typescript',
  code: string,
  setConsoleOutput: (output: string) => void,
  setExecutionStatus: (status: 'success' | 'error' | null) => void
) => {
  setConsoleOutput('');
  const webContainerInstance = await getWebContainerInstance();
  if (!webContainerInstance) {
    setConsoleOutput('WebContainer not initialized');
    return;
  }

  if (language === 'javascript') {
    await executeJavaScript(code, setConsoleOutput, setExecutionStatus);
  } else {
    // Compile TypeScript code to JavaScript
    const jsCode = compileTypeScript(code);

    // Execute the compiled JavaScript code
    await executeJavaScript(jsCode, setConsoleOutput, setExecutionStatus);
  }
};
