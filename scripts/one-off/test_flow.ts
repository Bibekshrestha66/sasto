// Quick verification test: Categories + Create Listing
const BASE = "http://localhost:3000/api/trpc";

async function test() {
  // Step 1: Check categories now return data
  console.log("=== STEP 1: Get Categories ===");
  try {
    const catRes = await fetch(`${BASE}/categories.list`);
    const catData = await catRes.json();
    const cats = catData?.result?.data?.json || [];
    console.log(`Status: ${catRes.status}`);
    console.log(`Categories count: ${cats.length}`);
    if (cats.length > 0) {
      cats.forEach((c: any) => console.log(`  - ${c.id}: ${c.name} ${c.icon || ''}`));
    } else {
      console.log("  ⚠️ No categories returned!");
    }
  } catch (e) {
    console.error("Categories error:", e);
  }

  // Step 2: Login to get session
  console.log("\n=== STEP 2: Login ===");
  let cookie = "";
  try {
    const loginRes = await fetch(`${BASE}/auth.login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        json: { email: "e2e_test@test.com", password: "Test1234" }
      }),
    });
    const loginData = await loginRes.json();
    console.log(`Status: ${loginRes.status}`);
    console.log(`User: ${loginData?.result?.data?.json?.name || 'N/A'}`);
    cookie = loginRes.headers.get("set-cookie") || "";
    console.log(`Got cookie: ${cookie ? '✅' : '❌'}`);
  } catch (e) {
    console.error("Login error:", e);
  }

  // Step 3: Create listing with a real category
  console.log("\n=== STEP 3: Create Listing ===");
  try {
    const listRes = await fetch(`${BASE}/listings.create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: JSON.stringify({
        json: {
          title: "Samsung Galaxy S24 Ultra",
          description: "Brand new Samsung Galaxy S24 Ultra, 256GB, Phantom Black. Unopened box with full warranty.",
          categoryId: 1,
          type: "marketplace",
          price: 125000,
          location: "Kathmandu",
          condition: "new",
        }
      }),
    });
    const listData = await listRes.json();
    console.log(`Status: ${listRes.status}`);
    if (listData?.result?.data?.json) {
      console.log(`✅ Listing created! ID: ${listData.result.data.json.lastInsertRowid}`);
    } else if (listData?.error) {
      console.log(`❌ Error: ${listData.error.json?.message || JSON.stringify(listData.error)}`);
    }
  } catch (e) {
    console.error("Create listing error:", e);
  }

  // Step 4: Verify listing appears in marketplace
  console.log("\n=== STEP 4: Get Listings ===");
  try {
    const listingsRes = await fetch(`${BASE}/listings.list`);
    const listingsData = await listingsRes.json();
    const items = listingsData?.result?.data?.json || [];
    console.log(`Status: ${listingsRes.status}`);
    console.log(`Total listings: ${items.length}`);
    if (items.length > 0) {
      items.slice(0, 3).forEach((l: any) => {
        console.log(`  - [${l.id}] ${l.title} - Rs.${l.price} (${l.status})`);
      });
    }
  } catch (e) {
    console.error("Listings error:", e);
  }

  // Step 5: Check auth.me works with cookie
  console.log("\n=== STEP 5: Auth.me (session check) ===");
  try {
    const meRes = await fetch(`${BASE}/auth.me`, {
      headers: cookie ? { Cookie: cookie } : {},
    });
    const meData = await meRes.json();
    console.log(`Status: ${meRes.status}`);
    if (meData?.result?.data?.json) {
      const u = meData.result.data.json;
      console.log(`✅ Logged in as: ${u.name} (${u.email}) - role: ${u.role}`);
    } else {
      console.log(`❌ Not authenticated`);
    }
  } catch (e) {
    console.error("Auth.me error:", e);
  }

  console.log("\n=== ALL TESTS COMPLETE ===");
}

test();
