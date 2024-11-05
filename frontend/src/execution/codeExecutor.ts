import { getWebContainerInstance } from '../webContainerInstance';
import { stripAnsiCodes } from '../utils/stringUtils';

// Function to execute JavaScript code
const executeJavaScript = async (
  code: string,
  setConsoleOutput: (output: string) => void
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
  } catch (error) {
    const err = error as Error;
    setConsoleOutput('Execution Error: ' + err.message);
  }
};

// Function to execute code based on the selected language
export const executeCode = async (
  language: 'javascript' | 'typescript',
  code: string,
  setConsoleOutput: (output: string) => void
) => {
  setConsoleOutput('');
  const webContainerInstance = await getWebContainerInstance();
  if (!webContainerInstance) {
    setConsoleOutput('WebContainer not initialized');
    return;
  }

  if (language === 'javascript') {
    await executeJavaScript(code, setConsoleOutput);
  } else {
    // Send TypeScript code to server for compilation
    const response = await fetch('https://compile-code-playground-tao242dn-tao242dns-projects.vercel.app/api/compile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const data = await response.json();
    const jsCode = data.jsCode;

    // Execute the compiled JavaScript code
    await executeJavaScript(jsCode, setConsoleOutput);
  }
};
