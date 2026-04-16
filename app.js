require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const initDatabase = require("./db/init");
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    ssl: {
        rejectUnauthorized: false,
    },
};

async function startApp() {
    try {
        await initDatabase(dbConfig);
        console.log("Database initialized successfully");
    } catch (err) {
        console.error("DB init failed:", err.message);
    }

    const pool = mysql.createPool(dbConfig);

    app.get("/api/recommendations", async (req, res) => {
        try {
            const [rows] = await pool.query(
                "SELECT * FROM recommendations ORDER BY created_at DESC"
            );
            res.json(rows);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.post("/api/recommendations", async (req, res) => {
        try {
            const { title, type, genre, year, comment, rating, image_url } = req.body;
            await pool.query(
                `INSERT INTO recommendations (title, type, genre, year, comment, rating, image_url)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [title, type, genre, year, comment, rating, image_url]
            );
            res.status(201).json({ message: "Created" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.delete("/api/recommendations/:id", async (req, res) => {
        try {
            await pool.query("DELETE FROM recommendations WHERE id = ?", [
                req.params.id,
            ]);
            res.json({ message: "Deleted" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.listen(process.env.PORT || 3000, () => {
        console.log("Server running on port", process.env.PORT || 3000);
    });
}

startApp();