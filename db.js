// db.js
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'NEXIIS',       // your DB username
  password: 'N3x!!sisdaG0@t', // your DB password
  database: 'clinique_la_vie',
  port: 3307 // adjust if your MySQL runs on a different port
});

db.connect(err => {
  if (err) {
    console.error('Database connection failed: ' + err.stack);
    return;
  }
  console.log('Connected to MySQL as id ' + db.threadId);
});

module.exports = db;
