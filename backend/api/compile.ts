import { VercelRequest, VercelResponse } from '@vercel/node';
import { transpileModule, ModuleKind } from 'typescript';
import setCorsHeaders from '../utils/setCorsHeaders';

export default (req: VercelRequest, res: VercelResponse) => {
  // Set CORS headers
  setCorsHeaders(res, ['POST', 'OPTIONS']);

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  // Validate request body
  if (!req.body || !req.body.code) {
    res.status(400).json({ error: 'Bad Request: "code" is required' });
    return;
  }

  try {
    // Your function logic
    const tsCode = req.body.code;
    const result = transpileModule(tsCode, {
      compilerOptions: { module: ModuleKind.CommonJS },
    });
    res.status(200).json({ jsCode: result.outputText });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', details: (error as Error).message });
  }
};
