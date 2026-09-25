const mysql = require('mysql2/promise');

async function checkDb() {
  try {
    const connection = await mysql.createConnection({
      host: 'srv2206.hstgr.io',
      user: 'u511331176_ecomm2',
      password: 'Kushmanda_123',
      database: 'u511331176_ecomm2'
    });

    console.log("Connected to u511331176_ecomm2 successfully!");
    
    // Fetch the vendor to see their info
    const [vendors] = await connection.execute('SELECT * FROM admin_users WHERE email = "vendor@whitewolfindia.com"');
    if (vendors.length > 0) {
      console.log("Found vendor!", {
        id: vendors[0].id,
        email: vendors[0].email,
        password: vendors[0].password,
      });
    } else {
      console.log("Vendor not found with that email!");
    }

    await connection.end();
  } catch (error) {
    console.error("Error connecting to DB:", error.message);
  }
}

checkDb();
