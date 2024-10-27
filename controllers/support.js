const nodemailer = require('nodemailer');
const customError = require('../customError');

async function sendMessageToCustomerCare(req, res, next) {
    try {
        const { name, email, description, phone } = req.body

        console.log(name, email, description, phone)
        // Create a transporter object using SMTP transport
        let transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com', // Replace with your SMTP server host
            port: 587, // Replace with your SMTP server port
            secure: false, // true for 465, false for other ports
            auth: {
                user: 'favoronyechere@gmail.com', // Replace with your SMTP username
                pass: 'vlsz ommx cwps rizw' // Replace with your SMTP password
            }
        });

        const mailOptions = {
            from: `Coinnet Support <${email}>`, // Replace with your sender email
            to: email, // Your email where you want to receive the emails
            subject: 'New Support Request from Coinnet',
            text: `Name: ${name}\nPhone: ${phone}\nEmail: ${email}\nDescription: ${description}`,
            html: `
            <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; background-color: #f9f9f9;">
                <h2 style="color: #4CAF50; text-align: center;">New Support Request</h2>
                <p style="font-size: 16px; color: #555;">You have received a new support request via the Coinnet platform.</p>
                <hr style="border: 0; border-top: 1px solid #ddd;">
                <p><strong style="color: #333;">Name:</strong> ${name}</p>
                <p><strong style="color: #333;">Phone:</strong> ${phone}</p>
                <p><strong style="color: #333;">Email:</strong> <a href="mailto:${email}" style="color: #4CAF50;">${email}</a></p>
                <p><strong style="color: #333;">Description:</strong></p>
                <p style="font-size: 14px; color: #777; line-height: 1.5;">${description}</p>
                <hr style="border: 0; border-top: 1px solid #ddd;">
                <p style="text-align: center; font-size: 14px; color: #999;">This message was sent from the Coinnet platform.</p>
            </div>
            `
        };
        
        await transporter.sendMail(mailOptions);

        return res.json({ message: 'Email sent successfully' });
    }
    catch (error) {
        console.log(error)
        return next(customError(error))
    }
}

module.exports = {sendMessageToCustomerCare}