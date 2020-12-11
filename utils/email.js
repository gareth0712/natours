const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1) Create a transporter
  const transporter = nodemailer.createTransport({
    // service: 'Gmail', // Using Gmail is not a good idea for production since:
    // a) It requires you to lower the security settings in gmail account
    // b) There will be a limit of 500 emails / day for gmail
    // c) It will probably be classified as spam as you use it more and more
    // We use mailtrap for development
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    // Activate in gmail "less secure app" option
  });
  // 2) Define the email options
  const mailOptions = {
    from: 'Gareth Lau <gary@gary.io>',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  // 3) Actually send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
