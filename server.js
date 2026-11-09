const express = require("express");
const path = require("path");
const db = require("./database");

const app = express();
const PORT = process.env.PORT || 3000;

// Read JSON sent by the browser and serve the dashboard files.
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function validateStudent(data) {
  const name = String(data.name || "").trim();
  const course = String(data.course || "").trim();
  const year_level = String(data.year_level || "").trim();
  const email = String(data.email || "").trim();

  if (!name || !course || !year_level || !email) {
    return { error: "Please complete all fields." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please enter a valid email address." };
  }
  return { student: { name, course, year_level, email } };
}

// READ: get all students.
app.get("/students", (req, res) => {
  const search = String(req.query.search || "").trim();
  const sql = `
    SELECT id, name, course, year_level, email, created_at
    FROM students
    WHERE name LIKE ? OR course LIKE ? OR email LIKE ?
    ORDER BY id DESC
  `;
  const keyword = `%${search}%`;

  db.all(sql, [keyword, keyword, keyword], (error, rows) => {
    if (error) return res.status(500).json({ error: "Could not load students." });
    res.json(rows);
  });
});

// Dashboard summary cards.
app.get("/stats", (req, res) => {
  db.get(`
    SELECT
      COUNT(*) AS total,
      COUNT(DISTINCT course) AS courses,
      SUM(CASE WHEN year_level = '1st Year' THEN 1 ELSE 0 END) AS first_year,
      SUM(CASE WHEN year_level = '4th Year' THEN 1 ELSE 0 END) AS fourth_year
    FROM students
  `, (error, row) => {
    if (error) return res.status(500).json({ error: "Could not load dashboard summary." });
    res.json({
      total: row.total || 0,
      courses: row.courses || 0,
      first_year: row.first_year || 0,
      fourth_year: row.fourth_year || 0
    });
  });
});

// CREATE: add a student.
app.post("/students", (req, res) => {
  const result = validateStudent(req.body);
  if (result.error) return res.status(400).json({ error: result.error });

  const { name, course, year_level, email } = result.student;
  db.run(
    "INSERT INTO students (name, course, year_level, email) VALUES (?, ?, ?, ?)",
    [name, course, year_level, email],
    function (error) {
      if (error) {
        if (error.message.includes("UNIQUE")) {
          return res.status(409).json({ error: "That email is already registered." });
        }
        return res.status(500).json({ error: "Could not add student." });
      }
      res.status(201).json({ message: "Student added successfully.", id: this.lastID });
    }
  );
});

// UPDATE: edit a student.
app.put("/students/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "Invalid student ID." });
  }

  const result = validateStudent(req.body);
  if (result.error) return res.status(400).json({ error: result.error });

  const { name, course, year_level, email } = result.student;
  db.run(
    "UPDATE students SET name = ?, course = ?, year_level = ?, email = ? WHERE id = ?",
    [name, course, year_level, email, id],
    function (error) {
      if (error) {
        if (error.message.includes("UNIQUE")) {
          return res.status(409).json({ error: "That email is already registered." });
        }
        return res.status(500).json({ error: "Could not update student." });
      }
      if (this.changes === 0) return res.status(404).json({ error: "Student not found." });
      res.json({ message: "Student updated successfully." });
    }
  );
});

// DELETE: remove a student.
app.delete("/students/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "Invalid student ID." });
  }

  db.run("DELETE FROM students WHERE id = ?", [id], function (error) {
    if (error) return res.status(500).json({ error: "Could not delete student." });
    if (this.changes === 0) return res.status(404).json({ error: "Student not found." });
    res.json({ message: "Student deleted successfully." });
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running at http://localhost:${PORT}`);
});