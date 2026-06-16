import bcrypt from 'bcryptjs';

const password = 'TestPassword123!';
bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(hash);
});
