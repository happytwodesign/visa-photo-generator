import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, photoUrl, pdfUrls } = req.body;

  // Create a test account or use your own SMTP configuration
  let transporter = nodemailer.createTransport({
    host: "smtp.example.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    let info = await transporter.sendMail({
      from: '"Your App" <noreply@example.com>',
      to: email,
      subject: "Your Schengen Visa Photos",
      text: "Here are your Schengen visa photos and PDFs.",
      html: `
        <p>Here are your Schengen visa photos and PDFs:</p>
        <p>Online submission photo: <a href="${photoUrl}">Download</a></p>
        ${pdfUrls.map((url, index) => `
          <p>${['A4', 'A5', 'A6'][index]} PDF: <a href="${url}">Download</a></p>
        `).join('')}
      `,
    });

    console.log("Message sent: %s", info.messageId);
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
}