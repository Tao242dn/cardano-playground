// src/components/ConsoleOutput.tsx

import React from 'react';

interface ConsoleOutputProps {
  consoleOutput: string;
  executionStatus: 'success' | 'error' | null;
}

const ConsoleOutput: React.FC<ConsoleOutputProps> = ({ consoleOutput, executionStatus }) => {
  return (
    <div
      className={`h-full rounded-lg p-4 transition-all duration-200 ${
        executionStatus === 'success'
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
  );
};

export default ConsoleOutput;
