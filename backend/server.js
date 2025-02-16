const express = require('express');
const mysql = require('mysql2/promise'); // Use mysql2 with promises
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());


const createDBConnection = async () => {
    return mysql.createConnection({
        host: 'db',
        user: 'root',
        password: 'password',
        database: 'mugglemedia',
    });
};


const waitForDB = async () => {
    let db;
    while (true) {
        try {
            db = await createDBConnection();
            console.log('MySQL connected...');
            break;
        } catch (err) {
            console.error('Waiting for MySQL...', err.message);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
    return db;
};


const startServer = async () => {
    const db = await waitForDB();



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
            res.send({ id: result.insertId, ...req.body });
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

startServer();