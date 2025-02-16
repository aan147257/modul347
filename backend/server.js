const express = require('express');
const mysql = require('mysql2/promise'); // Use mysql2 with promises
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Function to create a new MySQL connection
const createDBConnection = async () => {
    return mysql.createConnection({
        host: 'db', // Use 'db' as the hostname (Docker service name)
        user: 'root',
        password: 'password',
        database: 'mugglemedia',
    });
};

// Function to wait for MySQL to be ready
const waitForDB = async () => {
    let db;
    while (true) {
        try {
            db = await createDBConnection();
            console.log('MySQL connected...');
            break; // Exit the loop if the connection is successful
        } catch (err) {
            console.error('Waiting for MySQL...', err.message);
            await new Promise(resolve => setTimeout(resolve, 5000)); // Retry after 5 seconds
        }
    }
    return db;
};

// Function to start the Express server
const startServer = async () => {
    const db = await waitForDB(); // Wait for the database connection

    // Routes for Books
    app.get('/api/books', async (req, res) => {
        try {
            const [results] = await db.query('SELECT * FROM books');
            res.send(results);
        } catch (err) {
            console.error('Error fetching books:', err.message);
            res.status(500).send('Error fetching books');
        }
    });

    app.post('/api/books', async (req, res) => {
        const { title, author, description, release_date } = req.body;
        const query = 'INSERT INTO books (title, author, description, release_date) VALUES (?, ?, ?, ?)';
        try {
            const [result] = await db.query(query, [title, author, description, release_date]);
            res.send({ id: result.insertId, ...req.body }); // Return the inserted book data
        } catch (err) {
            console.error('Error adding book:', err.message);
            res.status(500).send('Error adding book');
        }
    });

    const PORT = 5000;
    app.listen(PORT, () => {
        console.log(`Server started on port ${PORT}`);
    });
};

// Start the server
startServer();