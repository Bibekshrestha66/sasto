// Test login via tRPC API directly
const url = 'http://localhost:3000/api/trpc/auth.login';
const body = JSON.stringify({
  "0": {
    "json": {
      "email": "bibekshrestha66@gmail.com",
      "password": "Sasto@Temp123456"
    }
  }
});

try {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body
  });
  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Response:', text);
} catch (err) {
  console.error('Fetch error:', err.message);
}
