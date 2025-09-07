const bcrypt = require('bcryptjs');

async function testPassword() {
  const password = 'admin123';
  const storedHash = '$2a$10$rOjLdw7hfqHq7f7PqVZ1/.gxPPDhNF3XjHZhXl.Bx7PkM3f5w5Hue';
  
  console.log('Testing password:', password);
  console.log('Against hash:', storedHash);
  
  const isValid = await bcrypt.compare(password, storedHash);
  console.log('Password valid:', isValid);
  
  // Also test generating a fresh hash
  const newHash = await bcrypt.hash(password, 10);
  console.log('Fresh hash would be:', newHash);
  
  const isNewValid = await bcrypt.compare(password, newHash);
  console.log('Fresh hash valid:', isNewValid);
}

testPassword();
