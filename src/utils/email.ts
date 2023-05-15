import nodemailer, { TransportOptions } from 'nodemailer';

interface Options {
  email: string;
  subject: string;
  message: string;
}

export const sendEmail = async (options: Options) => {
  // 1. Create a transporter
  // create reusable transporter object using the default SMTP transport
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_ADDRESS,
      pass: process.env.EMAIL_PASSWORD,
    },

    // Active in gmail "less secure app" option
  } as TransportOptions);

  //2. Define the email options
  const mailOptions = {
    from: '"Fred Foo 👻" <foo@example.com>', // sender address
    to: options.email, // list of receivers
    subject: options.subject, // Subject line
    text: options.message, // plain text body
    // html: '<b>Hello world?</b>', // html body
  };

  //3. Actually send the email
  await transporter.sendMail(mailOptions);
};
