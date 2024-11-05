import { VercelRequest, VercelResponse } from '@vercel/node';
import setCorsHeaders from '../utils/setCorsHeaders';

export default (req: VercelRequest, res: VercelResponse) => {
    try {
        // // Set CORS headers
        setCorsHeaders(res, 'GET');

        // Handle preflight OPTIONS request
        if (req.method === 'OPTIONS') {
            res.status(200).end();
            return;
        }

        // Only accept GET requests
        if (req.method !== 'GET') {
            res.status(405).json({ error: 'Method Not Allowed' });
            return;
        }

        res.status(200).json({ message: 'Hello, World!' });
    } catch (error) {
        console.error('Error in api/index.ts:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
