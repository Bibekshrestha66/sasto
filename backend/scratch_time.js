const t1 = 1779139464565; // User message ID 43 (ms)
const t2 = 1779139490;    // Admin message ID 44 (sec)

console.log('t1 (ms):', t1);
console.log('t1 as Date:', new Date(t1).toISOString());
console.log('t1 local string:', new Date(t1).toLocaleString());
console.log('t1 Kathmandu time:', new Date(t1).toLocaleString('en-US', { timeZone: 'Asia/Kathmandu' }));

console.log('\nt2 (sec):', t2);
console.log('t2 as Date if ms:', new Date(t2).toISOString());
console.log('t2 as Date if sec:', new Date(t2 * 1000).toISOString());
console.log('t2 Kathmandu time if sec:', new Date(t2 * 1000).toLocaleString('en-US', { timeZone: 'Asia/Kathmandu' }));
