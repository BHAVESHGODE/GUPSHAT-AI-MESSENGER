import nodemailer from "nodemailer";

export const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // 16-character Gmail App Password
    },
  });

  const mailOptions = {
    from: `GuppShup <${process.env.EMAIL_USER}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  await transporter.sendMail(mailOptions);
};

export default sendEmail;
