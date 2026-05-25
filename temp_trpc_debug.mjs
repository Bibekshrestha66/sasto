import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
const cookie = 'app_session_id=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcGVuSWQiOiJiaWJla3NocmVzdGhhNjZAZ21haWwuY29tIiwibmFtZSI6IkJpYmVrIFNocmVzdGhhIiwiZXhwIjoxODExMjYwOTkzfQ.t4AiyJ5fRu7AbLhNofE9JcJpA7CCSScJuHYGGvit-xI';
const client = createTRPCProxyClient({
  links: [httpBatchLink({
    url: 'http://localhost:3000/api/trpc',
    fetch: async (input, init) => {
      console.log('INPUT:', input);
      if (init?.body) {
        try { console.log('BODY:', init.body.toString()); } catch(e) { console.log('BODY RAW', init.body); }
      }
      console.log('HEADERS:', init?.headers);
      return fetch(input, {
        ...init,
        headers: {
          ...(init?.headers || {}),
          cookie,
        },
      });
    },
  })],
});
const result = await client.auth.me.query();
console.log('RESULT:', result);
