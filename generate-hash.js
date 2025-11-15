// Temporary script to generate password hash
const bcrypt = require('bcryptjs');

const password = 'faj3*fneiaksdhal89-32sa0+';
const hash = bcrypt.hashSync(password, 10);

console.log('\n===========================================');
console.log('PASSWORD HASH FOR NETLIFY ENVIRONMENT VARIABLE');
console.log('===========================================\n');
console.log('Copy this hash and add it to Netlify:\n');
console.log(hash);
console.log('\n===========================================');
console.log('\nSteps:');
console.log('1. Go to your Netlify site settings');
console.log('2. Environment variables');
console.log('3. Add variable:');
console.log('   Key: PASSWORD_HASH');
console.log('   Value: (paste the hash above)');
console.log('===========================================\n');
