const nodemailer = require('nodemailer');

const sendMail = require('../../controllers/sendmail');

describe('sendMail', () => {
  it('sendMail', async () => {
    const email = 'test@example.com';
    const html = '<h1>Test email</h1>';
    const subject = 'Test email subject';

    const info = await sendMail({ email, html, subject });
    expect(info).toBeDefined();
  });
});
