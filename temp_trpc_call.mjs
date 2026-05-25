import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
const cookie = 'app_session_id=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcGVuSWQiOiJiaWJla3NocmVzdGhhNjZAZ21haWwuY29tIiwibmFtZSI6IkJpYmVrIFNocmVzdGhhIiwiZXhwIjoxODExMjUzNDc4fQ.QBd3nWZQq-dWatfAFjW1GO42hhpYiVmripLYbSDjLIw';
const client = createTRPCProxyClient({
  links: [httpBatchLink({
    url: 'http://localhost:3000/api/trpc',
    fetch: (input, init) => fetch(input, {
      ...init,
      headers: {
        ...(init?.headers || {}),
        cookie,
      },
    }),
  })],
});

try {
  const result = await client.auth.me.query();
  console.log('OK', JSON.stringify(result));
} catch (err) {
  console.error('ERR', err);
}
