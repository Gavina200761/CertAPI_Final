# CertAPI - MVP Certification Tracking API

A RESTful Node.js backend API for managing professional certifications, learning resources, and project logs. Built for educational institutions to track student certification progress with role-based access control.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js 5.2.1
- **Database:** SQLite3 with Sequelize ORM
- **Testing:** Jest + Supertest
- **Authentication:** JWT-ready (schema prepared)
- **Middleware:** Custom request logging, JSON validation, content-type checking, error handling

## Project Structure

```
CertAPI_Final/
├── database/
│   ├── models/
│   │   ├── index.js              # Model initialization & relationships
│   │   ├── user.js                # User model
│   │   ├── certification.js        # Certification model
│   │   ├── learningResource.js     # Learning resource model
│   │   └── projectLog.js           # Project log model
│   ├── sequelize.js               # Database connection config
│   ├── setup.js                   # Database schema initialization
│   ├── seed.js                    # Sample data creation
│   ├── certapi.sqlite             # Production database
│   └── certapi.test.sqlite        # Test database
├── middleware/
│   ├── jsonParser.js              # JSON request parsing
│   ├── requestLogger.js           # HTTP request logging
│   ├── requireJsonContentType.js  # Content-type validation
│   ├── validateIdParam.js         # ID parameter type checking
│   └── errorHandler.js            # Centralized error handling
├── routes/
│   ├── users.js                   # User CRUD endpoints
│   ├── certifications.js          # Certification CRUD endpoints
│   ├── resources.js               # Learning resource CRUD endpoints
│   └── projectLogs.js             # Project log CRUD endpoints
├── tests/
│   └── api.test.js                # Jest integration tests
├── index.js                       # Express app entry point
├── package.json                   # Dependencies & scripts
└── README.md                      # This file
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm

### Steps

1. **Clone/Navigate to project:**
   ```bash
   cd "CertAPI_Final"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Initialize database schema:**
   ```bash
   npm run db:setup
   ```

4. **Populate with sample data:**
   ```bash
   npm run db:seed
   ```
   This creates 4 sample users (student/instructor/admin roles), 4 certifications, 6 learning resources, and 6 project logs.

5. **Start the server:**
   ```bash
   npm start
   ```
   Server listens on `http://localhost:3000`

## Running Tests

Execute the complete test suite:
```bash
npm test
```

Tests use an isolated in-memory SQLite database to ensure clean test runs without file system interference.

## Data Model

### Users
- **Role Types:** `student`, `instructor`, `admin`
- **Fields:** ID, name, email (unique), passwordHash, role, primaryGoal, createdAt, updatedAt
- **Relationships:** One-to-Many with Certifications and ProjectLogs

### Certifications
- **Status:** `planned`, `in_progress`, `completed`, `paused`
- **Difficulty:** `beginner`, `intermediate`, `advanced`
- **Fields:** ID, userId (FK), title, provider, description, difficultyLevel, status, createdAt, updatedAt
- **Relationships:** Belongs-to User, One-to-Many with LearningResources and ProjectLogs

### Learning Resources
- **Resource Types:** `course`, `practice_exam`, `documentation`, `video_tutorial`, `textbook`, `study_group`
- **Fields:** ID, certificationId (FK), type, title, url, estimatedHours, createdAt, updatedAt
- **Relationships:** Belongs-to Certification

### Project Logs
- **Status:** `pending`, `in_progress`, `completed`, `failed`
- **Fields:** ID, userId (FK), certificationId (FK), logDate, description, hoursSpent, status, createdAt, updatedAt
- **Relationships:** Belongs-to User and Certification

## Authentication

This API now uses JWT Bearer token authentication.

- Public endpoints: `POST /api/users/register`, `POST /api/users/login`
- Protected endpoints: all other `/api/users`, `/api/certifications`, `/api/resources`, and `/api/project-logs` routes
- Send tokens as: `Authorization: Bearer <token>`

Optional environment variables:

- `JWT_SECRET` (recommended in production)
- `JWT_EXPIRES_IN` (default: `1h`)

### Auth Endpoints

**POST /api/users/register**
- Registers a new user
- Required fields: `name`, `email`, `password`
- Role is set to `student` by default

**POST /api/users/login**
- Authenticates a user and returns a JWT token
- Required fields: `email`, `password`

**GET /api/users/validate-token**
- Validates the provided token and returns the authenticated user profile
- Requires Bearer token

**POST /api/users/logout**
- Revokes the current JWT token in server memory
- Requires Bearer token

## Authorization

The API enforces role-based access control using the `role` field on the `users` table.

- `student`: can manage only their own profile and their own certifications, resources, and project logs
- `instructor`: can view all users and all certification tracking data, but cannot modify or delete other users' records
- `admin`: has full access to all user and tracking endpoints, including cross-user management actions

Ownership rules:

- Non-admin certification writes are always limited to the authenticated user's own certifications
- Non-admin resource writes must point to a certification owned by the authenticated user
- Non-admin project log writes must point to the authenticated user's own certification data
- User profile updates and deletes are limited to the record owner unless the caller is an admin

## API Endpoints

All endpoints return JSON responses. The API uses standard HTTP status codes:
- **200** OK - Successful GET operation
- **201** Created - Successful POST operation
- **204** No Content - Successful DELETE operation
- **400** Bad Request - Invalid input or malformed JSON
- **404** Not Found - Resource does not exist
- **500** Internal Server Error - Server error (with error details)

### Users Resource

All user CRUD endpoints require authentication.

**GET /api/users**
- Returns paginated list of users
- Instructor or admin only
- Query params: `page`, `limit`, `role` (student|instructor|admin), `search` (name or email)
- Response: `{ data: [...], pagination: { page, limit, total, totalPages } }`
- Status: 200 | 403 (insufficient role)

**GET /api/users/:id**
- Returns single user by ID
- Allowed for the record owner, instructors, and admins
- Parameters: `id` (positive integer)
- Response: User object (passwordHash excluded)
- Status: 200 | 400 (invalid ID) | 403 (not own profile) | 404 (not found)

**GET /api/users/:id/certifications**
- Returns paginated certifications belonging to a specific user
- Allowed for the record owner, instructors, and admins
- Query params: `page`, `limit`, `status`, `difficultyLevel`
- Response: `{ data: [...], pagination: { page, limit, total, totalPages } }`
- Status: 200 | 403 (not own data)

**POST /api/users**
- Create new user
- Admin only
- Request body (JSON):
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "plaintext_password_here",
    "role": "student",
    "primaryGoal": "Optional goal description"
  }
  ```
- Response: Created user object with ID
- Status: 201 (created) | 400 (validation error, missing fields, duplicate email)

**PUT /api/users/:id**
- Update user by ID
- Allowed for the record owner or an admin
- Parameters: `id` (positive integer)
- Request body: Any user fields to update
- Response: Updated user object
- Status: 200 | 400 (invalid ID or validation error) | 404 (not found)

**DELETE /api/users/:id**
- Delete user by ID
- Allowed for the record owner or an admin
- Parameters: `id` (positive integer)
- Response: Empty (204 No Content)
- Status: 204 | 400 (invalid ID) | 404 (not found)

### Certifications Resource

- `GET` collection/item: owner, instructor, or admin
- `POST`/`PUT`/`DELETE`: owner or admin

**GET /api/certifications**
- Returns paginated certifications (scoped to owner for students)
- Query params: `page`, `limit`, `status` (planned|in_progress|completed|paused), `difficultyLevel` (beginner|intermediate|advanced), `search` (title, provider, or description)
- Response: `{ data: [...], pagination: { page, limit, total, totalPages } }`
- Status: 200

**GET /api/certifications/:id**
- Returns single certification by ID
- Parameters: `id` (positive integer)
- Response: Certification object
- Status: 200 | 400 (invalid ID) | 403 (not owner) | 404 (not found)

**GET /api/certifications/:id/resources**
- Returns paginated learning resources belonging to this certification
- Allowed for the certification owner, instructors, and admins
- Query params: `page`, `limit`, `type` (course|video|lab|practice_exam|book|article), `isCompleted` (true|false)
- Response: `{ data: [...], pagination: { page, limit, total, totalPages } }`
- Status: 200 | 403 | 404

**GET /api/certifications/:id/project-logs**
- Returns paginated project logs linked to this certification
- Allowed for the certification owner, instructors, and admins
- Query params: `page`, `limit`, `metric`, `startDate` (YYYY-MM-DD), `endDate` (YYYY-MM-DD)
- Response: `{ data: [...], pagination: { page, limit, total, totalPages } }`
- Status: 200 | 403 | 404

**GET /api/certifications/:id/progress**
- Returns a progress summary for this certification
- Allowed for the certification owner, instructors, and admins
- Response:
  ```json
  {
    "certificationId": 1,
    "title": "AWS SAA",
    "status": "in_progress",
    "difficultyLevel": "intermediate",
    "resources": {
      "total": 5,
      "completed": 3,
      "completionPercent": 60,
      "totalEstimatedMinutes": 420,
      "completedEstimatedMinutes": 240
    },
    "projectLogs": {
      "total": 8,
      "firstLogDate": "2026-01-10",
      "lastLogDate": "2026-04-20"
    }
  }
  ```
- Status: 200 | 403 | 404

**POST /api/certifications**
- Create new certification
- Request body (JSON):
  ```json
  {
    "userId": 1,
    "title": "AWS Solutions Architect",
    "provider": "Amazon Web Services",
    "description": "Cloud architecture certification",
    "difficultyLevel": "intermediate",
    "status": "planned"
  }
  ```
- Response: Created certification with ID
- Status: 201 | 400 (validation error or invalid userId FK) | 404 (user not found)

**PUT /api/certifications/:id**
- Update certification by ID
- Parameters: `id` (positive integer)
- Request body: Fields to update (title, status, difficultyLevel, etc.)
- Response: Updated certification object
- Status: 200 | 400 (invalid ID or validation error) | 404 (not found)

**DELETE /api/certifications/:id**
- Delete certification by ID
- Parameters: `id` (positive integer)
- Response: Empty (204 No Content)
- Status: 204 | 400 (invalid ID) | 404 (not found)

### Learning Resources

- `GET` collection/item: owner (via parent certification), instructor, or admin
- `POST`/`PUT`/`DELETE`: owner of the parent certification or admin

**GET /api/resources**
- Returns paginated resources (scoped to caller's certifications for students)
- Query params: `page`, `limit`, `type` (course|video|lab|practice_exam|book|article), `isCompleted` (true|false), `certificationId`, `search` (title)
- Response: `{ data: [...], pagination: { page, limit, total, totalPages } }`
- Status: 200

**GET /api/resources/:id**
- Returns single resource by ID
- Parameters: `id` (positive integer)
- Response: Resource object with certification link
- Status: 200 | 400 (invalid ID) | 404 (not found)

**POST /api/resources**
- Create new learning resource
- Request body (JSON):
  ```json
  {
    "certificationId": 1,
    "type": "course",
    "title": "AWS Architecture Basics",
    "url": "https://example.com/course",
    "estimatedHours": 40
  }
  ```
- Response: Created resource with ID
- Status: 201 | 400 (validation error or invalid certificationId FK) | 404 (cert not found)

**PUT /api/resources/:id**
- Update resource by ID
- Parameters: `id` (positive integer)
- Request body: Fields to update
- Response: Updated resource object
- Status: 200 | 400 (invalid ID or validation error) | 404 (not found)

**DELETE /api/resources/:id**
- Delete resource by ID
- Parameters: `id` (positive integer)
- Response: Empty (204 No Content)
- Status: 204 | 400 (invalid ID) | 403 (not owner) | 404 (not found)

**PATCH /api/resources/:id/toggle-complete**
- Toggles the `isCompleted` boolean on a resource
- Allowed for the resource owner or admin
- Parameters: `id` (positive integer)
- Response: Updated resource object
- Status: 200 | 403 (not owner) | 404 (not found)

### Project Logs

- `GET` collection/item: owner, instructor, or admin
- `POST`/`PUT`/`DELETE`: owner or admin

**GET /api/project-logs**
- Returns paginated project logs (scoped to owner for students)
- Query params: `page`, `limit`, `certificationId`, `metric`, `startDate` (YYYY-MM-DD), `endDate` (YYYY-MM-DD)
- Response: `{ data: [...], pagination: { page, limit, total, totalPages } }`
- Status: 200

**GET /api/project-logs/:id**
- Returns single log by ID
- Parameters: `id` (positive integer)
- Response: Log object with user/cert details
- Status: 200 | 400 (invalid ID) | 404 (not found)

**POST /api/project-logs**
- Create new project log entry
- Request body (JSON):
  ```json
  {
    "userId": 1,
    "certificationId": 1,
    "logDate": "2024-01-15",
    "description": "Completed module 2 on VPC networking",
    "hoursSpent": 2,
    "status": "in_progress"
  }
  ```
- Response: Created log with ID
- Status: 201 | 400 (validation error or invalid FK) | 404 (user or cert not found)

**PUT /api/project-logs/:id**
- Update log by ID
- Parameters: `id` (positive integer)
- Request body: Fields to update (description, status, hoursSpent, etc.)
- Response: Updated log object
- Status: 200 | 400 (invalid ID or validation error) | 404 (not found)

**DELETE /api/project-logs/:id**
- Delete log by ID
- Parameters: `id` (positive integer)
- Response: Empty (204 No Content)
- Status: 204 | 400 (invalid ID) | 404 (not found)

## Error Handling

The API implements centralized error handling that maps errors to meaningful HTTP responses:

**Validation Errors (400 Bad Request):**
```json
{
  "error": "Validation error",
  "details": ["Field 'email' is required", "Field 'role' must be one of: student, instructor, admin"]
}
```

**Malformed JSON (400):**
```json
{
  "error": "Invalid JSON in request body"
}
```

**Foreign Key Constraint (400):**
```json
{
  "error": "Foreign key constraint failed",
  "details": ["userId does not exist"]
}
```

**Not Found (404):**
```json
{
  "error": "Resource not found"
}
```

**Invalid ID Format (400):**
```json
{
  "error": "Invalid id parameter"
}
```

## Sample cURL Requests

**Get all users:**
```bash
curl http://localhost:3000/api/users
```

**Get user by ID:**
```bash
curl http://localhost:3000/api/users/1
```

**Create new certification:**
```bash
curl -X POST http://localhost:3000/api/certifications \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "title": "Google Cloud Professional",
    "provider": "Google Cloud",
    "description": "Advanced cloud architecture",
    "difficultyLevel": "advanced",
    "status": "planned"
  }'
```

**Update user:**
```bash
curl -X PUT http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"primaryGoal": "Complete 3 cloud certs by year end"}'
```

**Delete resource:**
```bash
curl -X DELETE http://localhost:3000/api/resources/1
```

## Sample Data

The seed script populates the database with:

**Users:**
- Alicia Brown (student) - Pursuing AWS Solutions Architect
- Marcus Patel (student) - Moving into cybersecurity
- Nina Lopez (instructor) - Coaching through tracks
- Jordan Reed (admin) - Platform governance

**Certifications:**
- AWS Solutions Architect Associate (Alicia, in_progress)
- CompTIA Security+ (Alicia, planned)
- Azure Administrator (Marcus, in_progress)
- Cisco CCNA (Marcus, paused)

**Learning Resources:** 6 sample courses/exams/videos per certifications

**Project Logs:** 6 sample study session logs tracking hours and progress

## Development Notes

- **Middleware Order:** Logging → Content-Type Validation → JSON Parsing → Routes → Error Handler
- **ID Validation:** All `:id` parameters validated as positive integers; invalid formats return 400
- **Database Transactions:** Uses Sequelize instance methods with error forwarding via Express middleware
- **Test Isolation:** Jest tests use in-memory SQLite database (`:memory:`) to prevent test interference
- **Environment:** Uses `DB_STORAGE` environment variable to switch between production and test databases

## Future Enhancements

- File uploads for resource attachments
- Email notifications for certification milestones
- Analytics dashboard for admin users
- Sorting options on list endpoints (`?sort=title&order=asc`)
