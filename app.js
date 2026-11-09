const rows = document.getElementById("studentRows");
const modal = document.getElementById("modalBackdrop");
const form = document.getElementById("studentForm");
const searchInput = document.getElementById("searchInput");
let editingId = null;

document.getElementById("today").textContent =
  new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const responseText = await response.text();
  let data;
  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch {
    throw new Error(`Server returned an unexpected response (${response.status}). Check that the correct Express server is running.`);
  }

  if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
  return data;
}

// Show a temporary notification after a successful action.
function showToast(message, type = "success") {
  let toast = document.getElementById("toastNotice");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toastNotice";
    toast.className = "toast-notice";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `toast-notice ${type} show`;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 3200);
}

async function loadDashboard() {
  try {
    const stats = await request("/stats");
    document.getElementById("totalStudents").textContent = stats.total;
    document.getElementById("totalCourses").textContent = stats.courses;
    document.getElementById("firstYear").textContent = stats.first_year;
    document.getElementById("fourthYear").textContent = stats.fourth_year;
  } catch (error) {
    showMessage(error.message);
  }
}

async function loadStudents() {
  rows.innerHTML = '<tr><td colspan="5" class="empty">Loading student records...</td></tr>';
  try {
    const students = await request("/students?search=" + encodeURIComponent(searchInput.value));
    document.getElementById("recordCount").textContent =
      `${students.length} record${students.length === 1 ? "" : "s"}`;

    if (!students.length) {
      rows.innerHTML = '<tr><td colspan="5" class="empty">No student records found. Add your first student.</td></tr>';
      return;
    }

    rows.innerHTML = students.map(student => `
      <tr>
        <td><strong>${escapeHTML(student.name)}</strong><div class="student-id">ID: ${student.id}</div></td>
        <td>${escapeHTML(student.course)}</td>
        <td>${escapeHTML(student.year_level)}</td>
        <td>${escapeHTML(student.email)}</td>
        <td>
          <button class="action-btn" data-action="edit" data-id="${student.id}">Edit</button>
          <button class="action-btn delete-btn" data-action="delete" data-id="${student.id}">Delete</button>
        </td>
      </tr>
    `).join("");
  } catch (error) {
    rows.innerHTML = `<tr><td colspan="5" class="empty">${escapeHTML(error.message)}</td></tr>`;
  }
}

// Escape text before placing database values into the page.
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
}

function openModal(student = null) {
  form.reset();
  document.getElementById("formMessage").textContent = "";
  editingId = student ? student.id : null;
  document.getElementById("modalTitle").textContent = student ? "Edit Student" : "Add Student";
  document.getElementById("saveBtn").textContent = student ? "Update Student" : "Save Student";

  if (student) {
    document.getElementById("name").value = student.name;
    document.getElementById("course").value = student.course;
    document.getElementById("year_level").value = student.year_level;
    document.getElementById("email").value = student.email;
  }
  modal.classList.add("show");
}

function closeModal() {
  modal.classList.remove("show");
  editingId = null;
}

document.getElementById("addBtn").addEventListener("click", () => openModal());
document.getElementById("closeBtn").addEventListener("click", closeModal);
document.getElementById("cancelBtn").addEventListener("click", closeModal);
modal.addEventListener("click", event => {
  if (event.target === modal) closeModal();
});

form.addEventListener("submit", async event => {
  event.preventDefault();
  const student = {
    name: document.getElementById("name").value,
    course: document.getElementById("course").value,
    year_level: document.getElementById("year_level").value,
    email: document.getElementById("email").value
  };

  const url = editingId ? `/students/${editingId}` : "/students";
  const method = editingId ? "PUT" : "POST";
  const saveButton = document.getElementById("saveBtn");
  const wasEditing = Boolean(editingId);
  saveButton.disabled = true;

  try {
    const result = await request(url, { method, body: JSON.stringify(student) });
    closeModal();
    await refreshPage();
    showToast(result.message || (wasEditing ? "Student updated successfully!" : "Student saved successfully!"));
  } catch (error) {
    document.getElementById("formMessage").textContent = error.message;
  } finally {
    saveButton.disabled = false;
  }
});

rows.addEventListener("click", async event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const id = Number(button.dataset.id);

  try {
    if (button.dataset.action === "edit") {
      const students = await request("/students");
      const student = students.find(item => item.id === id);
      if (student) openModal(student);
    } else if (button.dataset.action === "delete") {
      if (!confirm("Are you sure you want to delete this student?")) return;
      const result = await request(`/students/${id}`, { method: "DELETE" });
      await refreshPage();
      showToast(result.message || "Student deleted successfully!");
    }
  } catch (error) {
    alert(error.message);
  }
});

let searchTimer;
searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadStudents, 250);
});

async function refreshPage() {
  await Promise.all([loadStudents(), loadDashboard()]);
}

function showMessage(message) {
  console.error(message);
}

refreshPage();