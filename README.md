# StudyBoard — Student Management Dashboard

A responsive student dashboard built with **Express.js** and **SQLite**. It demonstrates all four CRUD operations:

- **Create:** Add a student.
- **Read:** View and search student records.
- **Update:** Edit student details.
- **Delete:** Remove a student record.

## Requirements

- Node.js
- npm

## Run the project

1. Open this project folder in your terminal.
2. Install the packages:

   ```bash
   npm install
   ```

3. Start the server:

   ```bash
   npm start
   ```

4. Open `http://localhost:3000` in your browser.

The SQLite database (`school.db`) is created automatically when the server starts. Student records remain saved in that file.

## Project structure

```text
student-management-dashboard/
├── public/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── database.js
├── server.js
├── package.json
└── README.md
```

## API routes

| Method | Route | Purpose |
|---|---|---|
| GET | `/students` | List/search students |
| GET | `/stats` | Dashboard summary |
| POST | `/students` | Add a student |
| PUT | `/students/:id` | Update a student |
| DELETE | `/students/:id` | Delete a student |

## Notes for the demonstration

For your screen recording, show the dashboard, add a student, search for that student, edit the details, and delete the record. Also show that the dashboard counts update after each change.

This is a local development project. For public deployment, use a hosting service that supports Node.js and persistent storage for the SQLite database.
