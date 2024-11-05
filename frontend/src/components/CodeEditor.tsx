import { useEffect } from 'react';
import MonacoEditor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

interface CodeEditorProps {
    value: string;
    onChange: (value: string) => void;
    language: 'typescript' | 'javascript';  // Allow both JavaScript and TypeScript
    theme?: 'light' | 'vs-dark';
}

const defaultString = `/** \n * This is playground for you write your code\n * Connect your wallet, write your code and interact with Cardano blockchain.\n * Let enjoy it!\n */`

const CodeEditor: React.FC<CodeEditorProps> = ({
    value,
    onChange,
    language = 'typescript',  // Default to TypeScript
    theme = 'vs-dark',
}) => {

    // Handle changes from the Monaco Editor
    const handleEditorChange = (newValue: string | undefined) => {
        if (newValue !== undefined) {
            onChange(newValue);
        }
    };

    // Configure TypeScript compiler options using useEffect
    useEffect(() => {
        if (language === 'typescript') {
            monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
                target: monaco.languages.typescript.ScriptTarget.ES2020,
                moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
                module: monaco.languages.typescript.ModuleKind.CommonJS,
                strict: true,
                noUnusedLocals: true,
                noUnusedParameters: true,
                noFallthroughCasesInSwitch: true,
            });

            monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
                noSemanticValidation: false, // Enable semantic checks
                noSyntaxValidation: false,   // Enable syntax checks
                noSuggestionDiagnostics: false, // Enable suggestion diagnostics
            });

            // Add basic Node.js types
            monaco.languages.typescript.typescriptDefaults.addExtraLib(`
            declare var console: {
                log(...data: any[]): void;
                error(...data: any[]): void;
                warn(...data: any[]): void;
                info(...data: any[]): void;
            };
            declare var process: {
                env: {
                    [key: string]: string | undefined;
                };
            };
        `, 'node.d.ts');

        } else if (language === 'javascript') {
            // Configure JavaScript compiler options
            monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
                target: monaco.languages.typescript.ScriptTarget.ES2020,
                moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
                module: monaco.languages.typescript.ModuleKind.CommonJS,
                allowJs: true,
                checkJs: true,
            });

            // Enable JavaScript syntax validation
            monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
                noSemanticValidation: false, // Enable semantic checks
                noSyntaxValidation: false,   // Enable syntax checks
                noSuggestionDiagnostics: false, // Enable suggestion diagnostics
            });
        }
    }, [language]); // Trigger when language changes

    return (
        <div className="rounded-lg overflow-hidden border border-gray-700 shadow-lg bg-[#1e1e1e] h-[calc(100vh-8rem)]">
            <MonacoEditor
                height="100%"
                width="100%"
                defaultValue={defaultString}
                language={language}
                value={value}
                theme={theme}
                onChange={handleEditorChange}
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    automaticLayout: true,
                    padding: { top: 30 },
                    scrollBeyondLastLine: false,
                    smoothScrolling: true,
                    cursorBlinking: 'smooth',
                    cursorSmoothCaretAnimation: "on",
                    formatOnPaste: true,
                    formatOnType: true,
                }}
            />
        </div>
    );
};

export default CodeEditor;
