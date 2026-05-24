import { db } from '../server/_core/db.js';
import { users } from '../drizzle/schema.js';
import { eq } from 'drizzle-orm';

async function updateRole() {
  const email = 'test@sasto.com';
  
  // Get current user
  const user = await db.select().from(users).where(eq(users.email, email));
  console.log('Current user state:', user[0]);
  
  if (user.length > 0) {
    // Update to seller
    await db.update(users)
      .set({ role: 'seller' })
      .where(eq(users.email, email));
      
    console.log(`Successfully updated ${email} to seller role.`);
    
    // Verify update
    const updatedUser = await db.select().from(users).where(eq(users.email, email));
    console.log('Updated user state:', updatedUser[0]);
  } else {
    console.log(`User ${email} not found.`);
  }
  
  process.exit(0);
}

updateRole().catch(console.error);
