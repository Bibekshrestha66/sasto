import bcrypt from 'bcryptjs';
const hash = '$2b$10$YKi0TN20LpM30RrstsPP4OdbmBUqHHNzGr5n0sG2jfXRYvhWl9AXq';
const password = 'Sasto@Temp123456';
const match = await bcrypt.compare(password, hash);
console.log('Match:', match);
