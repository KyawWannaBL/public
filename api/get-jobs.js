import { kv } from '@vercel/kv';

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    return response.status(405).json({ message: 'Only GET requests are allowed' });
  }

  try {
    // Fetch the list of job IDs from a set
    const jobIds = await kv.smembers('jobs');
    if (!jobIds || jobIds.length === 0) {
      return response.status(200).json([]);
    }

    // Fetch the details for each job
    const jobs = await kv.mget(...jobIds);
    
    return response.status(200).json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return response.status(500).json({ error: 'Failed to fetch job listings.' });
  }
}