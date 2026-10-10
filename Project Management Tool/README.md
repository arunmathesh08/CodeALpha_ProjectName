# TaskFlow - Full-Stack Project Management & Kanban Platform

TaskFlow is a modern, full-stack collaborative project management platform (similar to Trello / Asana) featuring real-time drag-and-drop Kanban boards, team management, activity streams, and live in-app notifications.

---

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, `@hello-pangea/dnd`, Lucide Icons, Axios, Socket.IO Client, Date-fns
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, Socket.IO
- **Database**: SQLite (default zero-config out of the box) or PostgreSQL via Prisma
- **Authentication**: JWT & bcryptjs password hashing
- **Real-Time**: Socket.IO for live board moves, task updates, comments & notifications

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (v18+)
- npm

### 2. Backend Setup
```bash
cd backend
npm install
npm run db:push
npm run db:seed
npm run dev
```
*Backend runs at `http://localhost:5000`*

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs at `http://localhost:5173`*

---

## 🔑 Demo Accounts

The database comes pre-seeded with sample users, projects, tasks, and comments. You can log in instantly with:

| User | Email | Password | Role |
| :--- | :--- | :--- | :--- |
| **Alex Johnson** | `alex@example.com` | `password123` | Admin / Owner |
| **Sarah Connor** | `sarah@example.com` | `password123` | Lead |
| **Michael Scott** | `michael@example.com` | `password123` | Developer |

*(One-click demo login buttons are also available directly on the login page)*

---

## ✨ Features

1. **Authentication & Authorization**
   - Register, Login, JWT Token authentication, Protected Routes, bcrypt hashing
2. **Dashboard**
   - Overview metrics: Total Projects, Active Projects, Completed Tasks, Overdue Tasks
   - My assigned tasks checklist with direct project links
   - Recent activity timeline
3. **Projects Management**
   - Create, Edit, Delete projects
   - Project status tags (`ACTIVE`, `ON_HOLD`, `COMPLETED`, `ARCHIVED`)
   - Add and remove project members with role permissions
4. **Kanban Board**
   - Drag-and-drop task movement between columns (`To Do`, `In Progress`, `Review`, `Completed`)
   - Reorder tasks inside columns with smooth visual placeholders
   - Quick task creation from column footers
5. **Task Details & Collaboration**
   - Edit title, description, priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), due date, and assignee
   - Real-time comments section (add, edit, delete comments)
   - Real-time notifications on assignment and new comments
6. **Search & Filters**
   - Live search by task title and description
   - Filter by priority
   - Filter by assignee / unassigned tasks
   - Switch between Kanban Board View and List View
7. **Design & UX**
   - Sleek SaaS-grade UI with Tailwind CSS
   - Dark mode & Light mode toggle with local storage persistence
   - Live Socket.IO synchronization across all active windows

---

## 📡 API Reference

### Authentication
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Authenticate user & get JWT token
- `GET /api/auth/me` - Get current authenticated user profile
- `GET /api/auth/users` - Search users to add as project members

### Projects
- `GET /api/projects` - Get all projects for current user
- `POST /api/projects` - Create new project with default Kanban board
- `GET /api/projects/:id` - Get project details, boards, columns, tasks, and members
- `PUT /api/projects/:id` - Update project details
- `DELETE /api/projects/:id` - Delete project (owner only)
- `POST /api/projects/:id/members` - Add member to project
- `DELETE /api/projects/:id/members/:userId` - Remove member from project

### Tasks
- `GET /api/tasks/project/:projectId` - Get tasks with filters
- `GET /api/tasks/:id` - Get task details with comments
- `POST /api/tasks` - Create task in column
- `PUT /api/tasks/:id` - Update task fields
- `PUT /api/tasks/:id/move` - Move task between columns / reorder
- `DELETE /api/tasks/:id` - Delete task

### Comments
- `GET /api/comments/task/:taskId` - Get task comments
- `POST /api/comments/task/:taskId` - Add comment
- `PUT /api/comments/:id` - Edit comment (author only)
- `DELETE /api/comments/:id` - Delete comment (author only)

### Notifications & Dashboard
- `GET /api/notifications` - Get user notifications & unread count
- `PUT /api/notifications/:id/read` - Mark single notification as read
- `PUT /api/notifications/read-all` - Mark all notifications as read
- `GET /api/dashboard` - Get summary metrics and recent activity
