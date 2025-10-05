import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "vaishd910@gmail.com",
    pass: "zbkiwummribhdkum",
  },
});

const sendEmail = async (to, subject, text) => {
  console.log({ user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS });
  await transporter.sendMail({
    from: `"Blogging App" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
  });
};

export default sendEmail;
