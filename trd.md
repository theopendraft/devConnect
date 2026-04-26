Technical Requirements Document (TRD)
1. Technology Stack

Frontend: React.js (Vite), Tailwind CSS (for rapid styling).

Backend: Node.js, Express.js.

Database: MongoDB Atlas (MERN stack requirement).

Authentication: Supabase Auth (fast implementation, secure token generation).

Version Control & CI/CD: Git, GitHub Actions.

Deployment: Vercel (Frontend & Backend).

2. System Architecture

Client (React): Handles UI rendering and state management. Sends requests to the backend with Supabase JWT tokens in the Authorization header.

API Gateway (Express): Receives requests, verifies the Supabase token using middleware, and interacts with the database.

Database (MongoDB): Stores the actual post content and the user ID associated with it.

3. Database Schema (MongoDB - posts collection)

JSON
{
  "_id": "ObjectId",
  "userId": "String (Supabase User UID)",
  "userEmail": "String",
  "content": "String (Max 500 characters)",
  "createdAt": "Timestamp"
}
4. API Endpoints (Express.js)

GET /api/posts

Description: Fetches all posts sorted by createdAt descending.

Auth Required: No (Public feed).

POST /api/posts

Description: Creates a new post.

Auth Required: Yes (Requires valid Supabase JWT).

Payload: { "content": "Hello world!" }

5. CI/CD Pipeline Configuration (.github/workflows/deploy.yml)

Trigger: On push to the main branch.

Jobs:

Build & Test: Setup Node.js environment -> Install dependencies (npm install) -> Run build (npm run build).

Deploy: Trigger Vercel CLI to deploy the latest build to production.

6. Development Workflow with AI

Antigravity AI: Used for generating the initial boilerplate for React components (Navbar, Feed, PostCard) and setting up Tailwind configurations.

Cursor IDE: Used for writing the Express.js API routes and MongoDB connection logic rapidly.

ChatGPT/Claude: Used for generating the CI/CD YAML file and the final README.md documentation.
