import { getMessages } from './db.js';

const msgs = await getMessages(1, 3015);
console.log('getMessages output:');
console.log(msgs.map(m => ({
  id: m.id,
  senderId: m.senderId,
  recipientId: m.recipientId,
  createdAt: m.createdAt,
  createdAtType: typeof m.createdAt,
  createdAtIsDate: m.createdAt instanceof Date,
  createdAtIso: m.createdAt instanceof Date ? m.createdAt.toISOString() : null,
  createdAtTime: m.createdAt instanceof Date ? m.createdAt.getTime() : null,
})));
