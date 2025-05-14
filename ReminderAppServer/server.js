const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Create a testing account with Ethereal for demo purposes
let testAccount;
let transporter;

async function setupMailer() {
    // Create test account (no real emails sent)
    testAccount = await nodemailer.createTestAccount();
    
    // Create transporter object
    transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass
        }
    });
    
    console.log('Test email account created:', testAccount.user);
}

setupMailer();

// API endpoint to send verification code
app.post('/send-verification', async (req, res) => {
    const { email, code } = req.body;
    
    if (!email || !code) {
        return res.status(400).json({ error: 'Email and code required' });
    }
    
    try {
        // Send email with verification code
        const info = await transporter.sendMail({
            from: '"Reminder App" <reminder@example.com>',
            to: email,
            subject: 'Your Verification Code',
            text: `Your verification code is: ${code}`,
            html: `<p>Your verification code is: <b>${code}</b></p>`
        });
        
        console.log('Message sent:', info.messageId);
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
        
        res.json({ 
            success: true, 
            previewUrl: nodemailer.getTestMessageUrl(info)
        });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'Failed to send email' });
    }
});

// API endpoint to send reminder notification
app.post('/send-reminder', async (req, res) => {
    const { email, reminder } = req.body;
    
    if (!email || !reminder) {
        return res.status(400).json({ error: 'Email and reminder details required' });
    }
    
    try {
        // Send email with reminder notification
        const info = await transporter.sendMail({
            from: '"Reminder App" <reminder@example.com>',
            to: email,
            subject: `Reminder: ${reminder.text}`,
            text: `This is a reminder for: ${reminder.text} scheduled at ${reminder.time}\n\n${reminder.message || ''}`,
            html: `<h3>Reminder: ${reminder.text}</h3><p>Time: ${reminder.time}</p>${reminder.message ? 
`<p>${reminder.message}</p>` : ''}`
        });
        
        console.log('Reminder sent:', info.messageId);
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
        
        res.json({ 
            success: true, 
            previewUrl: nodemailer.getTestMessageUrl(info)
        });
    } catch (error) {
        console.error('Error sending reminder:', error);
        res.status(500).json({ error: 'Failed to send reminder' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Reminder App Server running at http://localhost:${port}`);
});
