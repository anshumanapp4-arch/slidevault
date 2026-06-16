# SlideVault — Case Competition Slides Showcase Platform

A modern full-stack web application where users can view, search, filter, and upload case competition presentation slides (PDFs). Features JWT authentication, Cloudinary file storage, and a responsive glassmorphism UI.

![Tech Stack](https://img.shields.io/badge/Next.js-15-black?logo=next.js) ![Express](https://img.shields.io/badge/Express-4-green?logo=express) ![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?logo=mongodb) ![Tailwind](https://img.shields.io/badge/TailwindCSS-4-blue?logo=tailwindcss)

---

## ✨ Features

### Core
- 🖼️ **Browse Slides** — Responsive grid with preview images, tags, and author info
- 🔍 **Search** — Real-time search by title and tags
- 🏷️ **Filter** — Filter by tags with horizontal chip selector
- ↕️ **Sort** — Latest, Oldest, or Most Popular
- 📄 **Pagination** — Configurable page size
- 📤 **Upload** — Drag-and-drop upload with progress tracking (authenticated only)
- 🔐 **Auth** — JWT-based with HTTP-only cookies (Register, Login, Logout)

### Bonus
- ❤️ **Like** slides
- 🔖 **Bookmark** slides
- 👤 **User Profile** — View uploaded and bookmarked slides
- 🌗 **Dark Mode** — Persistent toggle with system preference sync

---

## 🗂️ Project Structure

```
E CELL PROJECT/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js              # MongoDB connection
│   │   │   └── cloudinary.js      # Cloudinary SDK config
│   │   ├── controllers/
│   │   │   ├── authController.js  # Auth logic
│   │   │   └── slideController.js # Slides CRUD + like/bookmark
│   │   ├── middleware/
│   │   │   ├── auth.js            # JWT verification
│   │   │   ├── upload.js          # Multer + Cloudinary upload
│   │   │   ├── errorHandler.js    # Global error handler
│   │   │   └── validate.js        # express-validator wrapper
│   │   ├── models/
│   │   │   ├── User.js            # User schema
│   │   │   └── Slide.js           # Slide schema
│   │   ├── routes/
│   │   │   ├── auth.js            # Auth routes
│   │   │   └── slides.js          # Slide routes
│   │   └── server.js              # Express entry point
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.js          # Root layout
│   │   │   ├── page.js            # Home (gallery)
│   │   │   ├── globals.css        # Global styles
│   │   │   ├── login/page.js      # Login
│   │   │   ├── register/page.js   # Register
│   │   │   ├── upload/page.js     # Upload (protected)
│   │   │   ├── profile/page.js    # User profile
│   │   │   └── slides/[id]/page.js# Slide detail
│   │   ├── components/
│   │   │   ├── Navbar.js
│   │   │   ├── Footer.js
│   │   │   ├── SlideCard.js
│   │   │   ├── SkeletonCard.js
│   │   │   ├── SearchBar.js
│   │   │   ├── TagFilter.js
│   │   │   ├── Pagination.js
│   │   │   ├── FileDropzone.js
│   │   │   └── DarkModeToggle.js
│   │   ├── context/
│   │   │   ├── AuthContext.js
│   │   │   └── ThemeContext.js
│   │   └── lib/
│   │       ├── api.js             # Axios instance
│   │       └── utils.js           # Utility functions
│   ├── .env.local
│   ├── .env.example
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account (free tier)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd "E CELL PROJECT"

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment

**Backend** (`backend/.env`):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.xxx.mongodb.net/slides-showcase
JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FRONTEND_URL=http://localhost:3000
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 3. Run Development Servers

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Health check: http://localhost:5000/api/health

---

## 📡 API Documentation

### Auth Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login, returns JWT cookie |
| POST | `/api/auth/logout` | No | Clear JWT cookie |
| GET | `/api/auth/me` | Yes | Get current user |

**Register Body:**
```json
{ "name": "John", "email": "john@example.com", "password": "secret123" }
```

**Login Body:**
```json
{ "email": "john@example.com", "password": "secret123" }
```

### Slide Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/slides` | No | List slides (paginated) |
| GET | `/api/slides/:id` | No | Get single slide |
| GET | `/api/slides/tags` | No | Get all unique tags |
| POST | `/api/slides` | Yes | Create slide (multipart) |
| PUT | `/api/slides/:id` | Yes | Update slide (author only) |
| DELETE | `/api/slides/:id` | Yes | Delete slide (author only) |
| POST | `/api/slides/:id/like` | Yes | Toggle like |
| POST | `/api/slides/:id/bookmark` | Yes | Toggle bookmark |

**GET /api/slides Query Params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 12 | Items per page (max 50) |
| search | string | - | Search title & tags |
| tags | string | - | Comma-separated tag filter |
| sort | string | latest | `latest`, `oldest`, `popular` |

---

## 🗄️ Database Schemas

### User
```
{
  name: String (required),
  email: String (unique, required),
  password: String (hashed, required),
  avatar: String (gravatar),
  bookmarks: [ObjectId → Slide],
  createdAt: Date
}
```

### Slide
```
{
  title: String (required),
  description: String (required),
  tags: [String],
  previewImageUrl: String (Cloudinary),
  slideUrl: String (Cloudinary, PDF),
  author: ObjectId → User,
  likes: [ObjectId → User],
  likesCount: Number,
  createdAt: Date
}
```

---

## 🌐 Deployment

### Frontend → Vercel
1. Push to GitHub
2. Import in [Vercel](https://vercel.com)
3. Set root directory: `frontend`
4. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = your backend URL (e.g., `https://your-api.onrender.com`)

### Backend → Render
1. Push to GitHub
2. Create Web Service on [Render](https://render.com)
3. Root directory: `backend`
4. Build command: `npm install`
5. Start command: `npm start`
6. Add all environment variables (MongoDB URI, JWT secret, Cloudinary creds, frontend URL)

### Database → MongoDB Atlas
1. Create free M0 cluster at [MongoDB Atlas](https://cloud.mongodb.com)
2. Create database user
3. Whitelist IPs (use `0.0.0.0/0` for Render)
4. Copy connection string → backend `.env`

---

## 📝 License

MIT
