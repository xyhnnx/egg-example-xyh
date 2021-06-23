const nodemailer = require('nodemailer');

const mailConfig = {
  subjectPrefix: '自动发送',
  host: 'smtp.sina.com',
  port: 465,
  debugEnabled: false,
  fromUsername: 'xyhlit@sina.com',
  fromPassword: 'cfb540e962b7def5',
  to: [
    '1101099728@qq.com'
  ],
  protocol: 'smtp',
  contentType: 'text/html;charset=gb2312',
  authEnabled: true,
  ipv6Enabled: false,
  enabled: true,
};

class Mail {
  async sendMail (err) {
    // create reusable transporter object using the default SMTP transport
    const transporter = nodemailer.createTransport({
      host: mailConfig.host,
      port: mailConfig.port,
      secure: true,
      auth: {
        user: mailConfig.fromUsername,
        pass: mailConfig.fromPassword,
      },
    });

    await transporter.sendMail({
      from: mailConfig.fromUsername,
      to: mailConfig.to,
      subject: mailConfig.subjectPrefix + `subject`,
      text: `text`,
      html: `<p>html</p>`, // html body
    });
  }
}
new Mail().sendMail()

module.exports = Mail;
