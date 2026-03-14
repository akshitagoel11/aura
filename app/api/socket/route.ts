import { NextApiRequest, NextApiResponse } from 'next';
import SocketHandler from '../../../lib/socket';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    await SocketHandler(req, res);
  } catch (error) {
    console.error('[Socket API] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
