import { randomBytes } from 'node:crypto';
import { hashPassword } from '../server/auth.js';

if (!process.stdin.isTTY) { console.error('Run this command in an interactive terminal.'); process.exit(1); }
console.log('Create your Williams administrator password (minimum 12 characters).');
process.stdout.write('Password: ');
process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding('utf8');
let password = '';
process.stdin.on('data', input => {
  for (const char of input) {
    if (char === '\u0003') { process.stdin.setRawMode(false); process.exit(1); }
    if (char === '\r' || char === '\n') {
      process.stdin.setRawMode(false); process.stdin.pause();
      if (password.length < 12 || password.length > 256) { console.error('\nChoose a password between 12 and 256 characters.'); process.exit(1); }
      console.log('\n\nKeep the password private. Add these server-only values to .env locally and Vercel Environment Variables:\n');
      console.log('ADMIN_PASSWORD_HASH=' + hashPassword(password));
      console.log('ADMIN_SESSION_SECRET=' + randomBytes(48).toString('hex'));
      console.log('\nAlso configure MONGODB_URI and MONGODB_DB. Then restart locally or redeploy Vercel and open /admin.');
      process.exit(0);
    }
    if (char === '\u007f' || char === '\b') { if (password.length) { password = password.slice(0, -1); process.stdout.write('\b \b'); } }
    else if (char >= ' ' && password.length < 256) { password += char; process.stdout.write('*'); }
  }
});
