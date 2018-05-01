const secrets    = require('../secrets.json')
const nodemailer = require('nodemailer');

const transport = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: secrets.emailuser,
        pass: secrets.emailpass,
    },
});

module.exports = function sendEmail(subject, message) {
    const mailOptions = {
        from: 'Sanity Software - CryptoTrader',
        to: activeUsername,
        subject: subject,
        html: message,
    };
    transport.sendMail(mailOptions, (error) => {
        if (error) {
            console.log(error);
        }
    });
};