const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3500;

// Enable CORS to allow requests from other origins (like your frontend)
app.use(cors());

// Middleware to parse JSON requests
app.use(express.json());

// MySQL database connection pool details using environment variables
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Check if an item with the same name and sticker ID already exists
app.post('/api/checkDuplicate', async (req, res) => {
  const { itemName, stickerId } = req.body;

  // Query to check if the item with the same name and sticker ID already exists in the database
  const [rows] = await pool.query(`
    SELECT * FROM items 
    WHERE itemName = ? AND stickerId = ?
  `, [itemName, stickerId]);

  if (rows.length > 0) {
    // If duplicate exists, return the existing quantity
    return res.json({ exists: true, quantity: rows[0].quantity });
  }

  // If no duplicate exists
  res.json({ exists: false });
});

// Save new item data into the database
app.post('/api/saveData', async (req, res) => {
  const { itemName, stickerId, quantity } = req.body;

  try {
    // Insert the new item data into the 'items' table
    await pool.query(`
      INSERT INTO items (itemName, stickerId, quantity)
      VALUES (?, ?, ?)
    `, [itemName, stickerId, quantity]);

    console.log('Item saved to MySQL:', { itemName, stickerId, quantity });
    res.status(200).send('Data saved successfully');
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).send('Error saving data');
  }
});

// Update the quantity of an existing item in the database
app.post('/api/updateQuantity', async (req, res) => {
  const { itemName, stickerId, quantity } = req.body;

  try {
    // Update the quantity for the item in the 'items' table
    const result = await pool.query(`
      UPDATE items
      SET quantity = ?
      WHERE itemName = ? AND stickerId = ?
    `, [quantity, itemName, stickerId]);

    if (result.affectedRows > 0) {
      console.log('Quantity updated for item:', { itemName, stickerId, quantity });
      return res.status(200).send('Quantity updated successfully');
    } else {
      console.log('No rows affected for update');
      return res.status(404).send('Item not found');
    }
  } catch (error) {
    console.error('Error updating quantity:', error);
    res.status(500).send('Error updating quantity');
  }
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
