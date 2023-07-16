const nodemailer = require("nodemailer");

const sendEmail = async options => {
  // create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
    // activate in gmail 'less secure app' option
  });

  // define the email options
  const mailOptions = {
    from: "Ratnesh Tiwari <ram@hello.ram",
    to: options.email,
    subject: options.subject,
    text: options.message
    // html:
  };

  // send email with nodemailer
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
