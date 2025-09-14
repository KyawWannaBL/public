import { kv } from '@vercel/kv';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Only POST requests are allowed' });
  }
  
  const { name, email, phone, position, coverLetter } = request.body;
  
  if (!name || !email || !position) {
    return response.status(400).json({ message: 'Name, email, and position are required.' });
  }
  
  try {
    // 1. Save application to database
    const applicationId = `application:${Date.now()}`;
    const applicationData = { name, email, phone, position, coverLetter, submittedAt: new Date().toISOString() };
    await kv.set(applicationId, applicationData);
    await kv.sadd('applications', applicationId);

    // 2. Send email notification
    await resend.emails.send({
      from: 'Britium Careers <career@britiumventures.com>',
      to: ['career@britiumventures.com', 'info@britiumventures.com'], // Sends to both addresses
      subject: `New Job Application: ${position}`,
      html: `
        <h1>New Application Received</h1>
        <p><strong>Position:</strong> ${position}</p>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <hr>
        <p><strong>Cover Letter:</strong></p>
        <p>${coverLetter || 'Not provided'}</p>
      `
    });
    
    return response.status(200).json({ message: 'Application submitted successfully! We will be in touch shortly.' });
  } catch (error) {
    console.error('Error submitting application:', error);
    return response.status(500).json({ error: 'Failed to submit application.' });
  }
}