# Devlink - Global Talent Marketplace

A professional talent marketplace connecting software developers worldwide with employers for remote and contract-based work.

## Tech Stack

### Frontend
- React + TypeScript
- TailwindCSS
- Shadcn/ui components
- React Router
- TanStack Query
- Vite

### Backend
- Node.js + Express
- TypeScript
- PostgreSQL
- JWT Authentication
- Zod validation

## Project Structure

```
devlink/
├── frontend/          # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # React contexts (Auth)
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Utilities and API client
│   │   └── pages/         # Page components
│   └── ...
│
├── backend/           # Express backend API
│   ├── src/
│   │   ├── config/        # Environment and database config
│   │   ├── db/            # Database schema and migrations
│   │   ├── middleware/    # Express middleware
│   │   ├── routes/        # API route handlers
│   │   ├── schemas/       # Zod validation schemas
│   │   ├── services/      # Business logic services
│   │   └── utils/         # Utility functions
│   └── ...
│
└── docker-compose.yml # Docker orchestration
```

## Features

### User Roles
- **Developer**: Create profile, apply to jobs, manage contracts, track earnings
- **Employer**: Post jobs, hire developers, manage contracts with escrow
- **Admin**: Platform management, dispute resolution, analytics

### Core Features
- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Job posting and application system
- Developer profile with skills, experience, and portfolio
- Milestone-based contracts with escrow payments
- Real-time messaging between users
- Rating and review system
- Admin dashboard with analytics

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- npm or bun

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from example:
```bash
cp .env.example .env
```

4. Configure environment variables:
```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://devlink:devlink@localhost:5432/devlink
JWT_ACCESS_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
CORS_ORIGIN=http://localhost:5173
UPLOAD_DIR=uploads
PLATFORM_COMMISSION_PCT=10
```

5. Initialize database:
```bash
npm run db:init
```

6. (Optional) Seed with sample data:
```bash
npm run db:seed
```

7. Start development server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Start development server:
```bash
npm run dev
```

### Docker Setup

To run the entire stack with Docker:

```bash
docker-compose up -d
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Developers
- `GET /api/developers` - List developers (with filters)
- `GET /api/developers/:id` - Get developer profile
- `PATCH /api/developers/me` - Update own profile
- `POST /api/developers/me/resume` - Upload resume

### Employers
- `GET /api/employers` - List employers
- `GET /api/employers/:id` - Get employer profile
- `PATCH /api/employers/me` - Update own profile

### Jobs
- `GET /api/jobs` - List jobs (with filters)
- `GET /api/jobs/:id` - Get job details
- `POST /api/jobs` - Create job (employer)
- `PATCH /api/jobs/:id` - Update job
- `POST /api/jobs/:id/close` - Close job
- `DELETE /api/jobs/:id` - Delete job

### Applications
- `POST /api/applications/:jobId` - Apply to job (developer)
- `GET /api/applications/job/:jobId` - Get job applicants (employer)
- `GET /api/applications/me` - Get my applications (developer)
- `PATCH /api/applications/:id/status` - Update application status

### Contracts
- `POST /api/contracts` - Create contract
- `GET /api/contracts` - List my contracts
- `GET /api/contracts/:id` - Get contract details
- `POST /api/contracts/:id/fund` - Fund contract escrow
- `POST /api/contracts/:id/milestones/:msId/submit` - Submit milestone
- `POST /api/contracts/:id/milestones/:msId/release` - Release milestone payment
- `POST /api/contracts/:id/dispute` - Raise dispute

### Messages
- `GET /api/messages/conversations` - Get conversations
- `GET /api/messages/conversations/:id` - Get messages
- `POST /api/messages` - Send message

### Reviews
- `POST /api/reviews` - Create review
- `GET /api/reviews/user/:id` - Get user reviews

### Admin
- `GET /api/admin/analytics` - Dashboard analytics
- `GET /api/admin/users` - List users
- `PATCH /api/admin/users/:id/status` - Update user status
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/jobs` - List all jobs
- `PATCH /api/admin/jobs/:id/status` - Update job status
- `GET /api/admin/config` - Get platform config
- `PATCH /api/admin/config` - Update platform config
- `GET /api/admin/disputes` - List disputes
- `POST /api/admin/disputes/:id/resolve` - Resolve dispute
- `GET /api/admin/audit-logs` - View audit logs

## Database Schema

### Core Tables
- `users` - User accounts
- `refresh_tokens` - JWT refresh tokens
- `developers` - Developer profiles
- `employers` - Employer/company profiles
- `jobs` - Job postings
- `applications` - Job applications
- `conversations` - Message conversations
- `messages` - Individual messages
- `contracts` - Work contracts
- `milestones` - Contract milestones
- `escrow_transactions` - Payment transactions
- `reviews` - User reviews
- `admin_config` - Platform configuration
- `audit_logs` - Financial audit trail

## Escrow Payment Flow

1. **Employer creates contract** with milestones
2. **Employer funds escrow** - total amount held by platform
3. **Developer works** on milestones
4. **Developer submits** completed milestone
5. **Employer approves** and releases payment
6. **Platform deducts commission** (configurable, default 10%)
7. **Developer receives** remaining amount

### Dispute Resolution
- Either party can raise a dispute
- Admin reviews and resolves
- Funds can be released to developer or refunded to employer

## Security Features

- Password hashing with bcrypt
- JWT access tokens (short-lived) + refresh tokens
- Role-based access control
- Input validation with Zod
- Rate limiting
- Helmet security headers
- CORS configuration
- Audit logging for financial transactions

## License

MIT
