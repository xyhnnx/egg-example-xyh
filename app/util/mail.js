const nodemailer = require('nodemailer');

const mailConfig = {
  subjectTitle: 'xyh',
  host: 'smtp.sina.com',
  port: 465,
  debugEnabled: false,
  fromUsername: 'xyhlit@sina.com',
  fromPassword: 'cfb540e962b7def5',
  to: [
    '1101099728@qq.com'
  ],
  protocol: 'smtp',
  contentType: 'text/html;charset=utf-8',
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
      // 标题
      subject: mailConfig.subjectTitle,
      // 内容
      html: `<div>这里是html内容 2</div>`, // html body
    });
  }
}
// new Mail().sendMail()

module.exports = Mail;
