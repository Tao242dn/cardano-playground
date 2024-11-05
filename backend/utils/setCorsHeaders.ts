import { VercelResponse } from "@vercel/node";

const setCorsHeaders = (res: VercelResponse, methods: string | string[]) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', methods);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default setCorsHeaders