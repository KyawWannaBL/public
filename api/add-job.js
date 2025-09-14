import { kv } from '@vercel/kv';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Only POST requests are allowed' });
  }

  // Simple security check (in a real app, use proper authentication)
  const authToken = request.headers['authorization'];
  if (authToken !== `Bearer ${process.env.ADMIN_SECRET_KEY}`) {
      return response.status(401).json({ message: 'Unauthorized' });
  }

  const { title, location, type } = request.body;
  
  if (!title || !location || !type) {
    return response.status(400).json({ message: 'Title, location, and type are required.' });
  }
  
  try {
    const jobId = `job:${Date.now()}`; // Create a unique ID
    
    // Store the job details
    await kv.set(jobId, { title, location, type });
    
    // Add the new job's ID to our list of jobs
    await kv.sadd('jobs', jobId);
    
    return response.status(201).json({ message: 'Job added successfully', jobId });
  } catch (error) {
    console.error('Error adding job:', error);
    return response.status(500).json({ error: 'Failed to add job.' });
  }
}