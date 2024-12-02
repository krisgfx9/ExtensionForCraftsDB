const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3500;

// Middleware
app.use(cors());
app.use(express.json());

// MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

// Endpoint to save craft data
app.post("/api/saveCraft", async (req, res) => {
  const {
    float,
    pattern,
    sticker1,
    sticker2,
    sticker3,
    sticker4,
    sticker5,
    quantity,
    ownership_status,
  } = req.body;

  console.log("Received Craft Data:", {
    float,
    pattern,
    sticker1,
    sticker2,
    sticker3,
    sticker4,
    sticker5,
    quantity,
    ownership_status,
  });

  try {
    // Match skin by name
    const [skinRows] = await pool.query(
      "SELECT skin_id FROM skins WHERE skin_name = ?",
      [req.body.skinName]
    );
    if (skinRows.length === 0) {
      console.error("Skin not found.");
      return res.status(400).json({ error: "Skin not found" });
    }
    const skinID = skinRows[0].skin_id;

    // Match stickers by IDs
    const stickerIDs = [sticker1, sticker2, sticker3, sticker4, sticker5].filter(Boolean);
    const placeholders = stickerIDs.map(() => "?").join(", ");
    const [stickerRows] = await pool.query(
      `SELECT sticker_id FROM stickers WHERE sticker_id IN (${placeholders})`,
      stickerIDs
    );

    if (stickerRows.length !== stickerIDs.length) {
      console.error("One or more stickers not found.");
      return res.status(400).json({ error: "One or more stickers not found" });
    }

    // Insert craft data
    const [result] = await pool.query(
      `INSERT INTO crafts 
       (skin, float, pattern, sticker1, sticker2, sticker3, sticker4, sticker5, quantity, ownership_status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [skinID, float, pattern, sticker1, sticker2, sticker3, sticker4, sticker5, quantity, ownership_status]
    );

    console.log("Craft data saved:", { craftId: result.insertId });
    res.status(200).json({ message: "Craft saved successfully", craftId: result.insertId });
  } catch (error) {
    console.error("Error saving craft:", error);
    res.status(500).json({ error: "Error saving craft" });
  }
});

// Default error handler for unexpected issues
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).send("Something went wrong!");
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
