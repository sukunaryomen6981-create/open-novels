import nodemailer from 'nodemailer';

let tx = null;
function transporter() {
  if (tx) return tx;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  tx = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
  return tx;
}

// Sends the verification email. If SMTP isn't configured (local dev), the
// link is printed to the server console instead so nothing silently breaks.
export async function sendVerificationEmail(to, link) {
  const t = transporter();
  if (!t) {
    console.log(`[mailer] SMTP not configured — verification link for ${to}: ${link}`);
    return { delivered: false };
  }
  await t.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: 'Verify your OpenNovels email ✒️',
    text: `Welcome to OpenNovels!\n\nConfirm your email to start publishing:\n${link}\n\nThis link expires in 24 hours. If you didn't sign up, ignore this email.`,
    html: `<div style="font-family:Georgia,serif;max-width:480px"><h2>Welcome to OpenNovels ✒️</h2><p>Confirm your email to start publishing your stories:</p><p><a href="${link}" style="display:inline-block;background:#E5A83B;color:#16130E;font-weight:bold;padding:12px 24px;border-radius:10px;text-decoration:none">Verify my email →</a></p><p style="color:#888;font-size:13px">Link expires in 24 hours. Didn't sign up? Ignore this email.</p></div>`
  });
  return { delivered: true };
}
