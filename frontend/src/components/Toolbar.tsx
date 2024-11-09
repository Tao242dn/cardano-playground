/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/Toolbar.tsx

import React from 'react';
import examples from '../data/examples';

interface ToolbarProps {
    language: 'javascript' | 'typescript';
    setLanguage: React.Dispatch<React.SetStateAction<'javascript' | 'typescript'>>;
    setCode: React.Dispatch<React.SetStateAction<string>>;
    handleExecuteCode: () => Promise<void>;
    handleCopyCode: () => Promise<void>;
    isLoading: boolean;
    setConsoleOutput: React.Dispatch<React.SetStateAction<string>>;
    setExecutionStatus: React.Dispatch<React.SetStateAction<'success' | 'error' | null>>;
}

const Toolbar: React.FC<ToolbarProps> = ({
    language,
    setLanguage,
    setCode,
    handleExecuteCode,
    handleCopyCode,
    isLoading,
    setConsoleOutput,
    setExecutionStatus,
}) => {
    const handleLoadExample = (example: any) => {
        setCode(example.code);
        setLanguage(example.language);
        setConsoleOutput('');
        setExecutionStatus(null);
        sessionStorage.setItem('code', example.code);
        sessionStorage.setItem('language', example.language);
    };

    return (
        <>
            <div className="max-w-7xl mx-auto px-6 py-4">
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
        </>
    );
};

export default Toolbar;
