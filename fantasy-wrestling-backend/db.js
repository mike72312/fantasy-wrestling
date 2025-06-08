// db.js
const mysql = require('mysql2');

// Create a connection to the database
const db = mysql.createConnection({
    host: 'localhost',  // Your MySQL host (typically localhost)
    user: 'root',       // Your MySQL username
    password: 'mike723', // Your MySQL password
    database: 'fantasy_wrestling' // The name of your database
});

// Test the connection
db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the database');
});

module.exports = db;