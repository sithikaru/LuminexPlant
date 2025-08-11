# LuminexPlant Development Instructions for ChatGPT

## 🎯 Overview
This document provides complete step-by-step instructions for implementing the LuminexPlant Digital Plant Processing & Tracking System. Follow these instructions precisely to build a production-ready system.

## 📋 Technology Stack (Latest Stable)
- **Frontend**: Next.js 14.x, React 18.x, TypeScript 5.x
- **Styling**: Tailwind CSS 3.x, Shadcn/ui
- **Backend**: Node.js 20.x, Express.js 4.x
- **Database**: PostgreSQL 16.x, Prisma 5.x
- **Authentication**: NextAuth.js 4.x
- **Cache**: Redis 7.x
- **Cloud**: AWS (EC2, RDS, S3, SES)
- **DevOps**: Docker, GitHub Actions

## 🏗️ Project Structure

### Repository Setup
Create TWO separate repositories:

#### Frontend Repository: `luminex-plant-frontend`
```
luminex-plant-frontend/
├── .env.local
├── .env.example
├── .gitignore
├── .eslintrc.json
├── .prettierrc
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── package.json
├── Dockerfile
├── docker-compose.yml
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/
│   │   │   ├── admin/
│   │   │   ├── manager/
│   │   │   └── officer/
│   │   └── api/
│   │       └── auth/
│   ├── components/
│   │   ├── ui/
│   │   ├── forms/
│   │   ├── charts/
│   │   ├── layouts/
│   │   └── tables/
│   ├── lib/
│   │   ├── utils.ts
│   │   ├── validations.ts
│   │   ├── api.ts
│   │   └── constants.ts
│   ├── hooks/
│   ├── store/
│   └── types/
└── public/
```

#### Backend Repository: `luminex-plant-backend`
```
luminex-plant-backend/
├── .env
├── .env.example
├── .gitignore
├── .eslintrc.json
├── .prettierrc
├── tsconfig.json
├── package.json
├── Dockerfile
├── docker-compose.yml
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── config/
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   └── aws.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── species.controller.ts
│   │   ├── batch.controller.ts
│   │   ├── zone.controller.ts
│   │   └── measurement.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── rateLimiter.middleware.ts
│   │   └── errorHandler.middleware.ts
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── validations/
│   └── types/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
└── tests/
```

## 🚀 Phase 1: Project Setup (Week 1-2)

### Step 1.1: Initialize Frontend Project

Create Next.js project:
```bash
npx create-next-app@latest luminex-plant-frontend --typescript --tailwind --eslint --app --src-dir
cd luminex-plant-frontend
```

Install dependencies:
```bash
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select @radix-ui/react-toast class-variance-authority clsx tailwind-merge lucide-react
npm install next-auth @auth/prisma-adapter
npm install @tanstack/react-query axios
npm install recharts date-fns
npm install -D @types/node
```

Configure Shadcn/ui:
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input label card table dialog dropdown-menu select toast
```

### Step 1.2: Initialize Backend Project

Create backend directory and initialize:
```bash
mkdir luminex-plant-backend
cd luminex-plant-backend
npm init -y
```

Install dependencies:
```bash
npm install express cors helmet morgan compression
npm install @prisma/client prisma
npm install bcryptjs jsonwebtoken
npm install express-rate-limit express-validator
npm install redis ioredis
npm install aws-sdk nodemailer
npm install winston
npm install -D @types/express @types/node @types/bcryptjs @types/jsonwebtoken @types/cors
npm install -D typescript ts-node nodemon
npm install -D jest @types/jest supertest @types/supertest
```

### Step 1.3: Database Schema Design

Create `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  firstName String
  lastName  String
  role      UserRole
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  createdBatches    Batch[]       @relation("BatchCreatedBy")
  measurements      Measurement[]
  auditLogs         AuditLog[]
  notifications     Notification[]
  tasks             Task[]

  @@map("users")
}

model Species {
  id             String  @id @default(cuid())
  name           String  @unique
  scientificName String?
  targetGirth    Float   // in cm
  targetHeight   Float   // in cm
  isActive       Boolean @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relations
  batches Batch[]

  @@map("species")
}

model Zone {
  id        String   @id @default(cuid())
  name      String   @unique
  capacity  Int
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  beds    Bed[]
  batches Batch[]

  @@map("zones")
}

model Bed {
  id        String   @id @default(cuid())
  name      String
  capacity  Int
  occupied  Int      @default(0)
  zoneId    String
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  zone    Zone    @relation(fields: [zoneId], references: [id])
  batches Batch[]

  @@unique([name, zoneId])
  @@map("beds")
}

model Batch {
  id           String      @id @default(cuid())
  batchNumber  String      @unique
  customName   String?
  pathway      PathwayType
  speciesId    String
  initialQty   Int
  currentQty   Int
  status       BatchStatus @default(CREATED)
  stage        BatchStage  @default(INITIAL)
  isReady      Boolean     @default(false)
  readyDate    DateTime?
  lossReason   String?
  lossQty      Int         @default(0)
  createdById  String
  zoneId       String?
  bedId        String?
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  // Relations
  species      Species       @relation(fields: [speciesId], references: [id])
  createdBy    User          @relation("BatchCreatedBy", fields: [createdById], references: [id])
  zone         Zone?         @relation(fields: [zoneId], references: [id])
  bed          Bed?          @relation(fields: [bedId], references: [id])
  measurements Measurement[]
  stageHistory StageHistory[]
  auditLogs    AuditLog[]

  @@map("batches")
}

model Measurement {
  id        String   @id @default(cuid())
  batchId   String
  userId    String
  girth     Float    // in cm
  height    Float    // in cm
  sampleSize Int     @default(1)
  notes     String?
  createdAt DateTime @default(now())

  // Relations
  batch Batch @relation(fields: [batchId], references: [id])
  user  User  @relation(fields: [userId], references: [id])

  @@map("measurements")
}

model StageHistory {
  id        String     @id @default(cuid())
  batchId   String
  fromStage BatchStage?
  toStage   BatchStage
  quantity  Int
  notes     String?
  createdAt DateTime   @default(now())

  // Relations
  batch Batch @relation(fields: [batchId], references: [id])

  @@map("stage_history")
}

model AuditLog {
  id        String   @id @default(cuid())
  userId    String
  batchId   String?
  action    String
  oldValues Json?
  newValues Json?
  createdAt DateTime @default(now())

  // Relations
  user  User   @relation(fields: [userId], references: [id])
  batch Batch? @relation(fields: [batchId], references: [id])

  @@map("audit_logs")
}

model Notification {
  id        String           @id @default(cuid())
  userId    String
  type      NotificationType
  title     String
  message   String
  isRead    Boolean          @default(false)
  createdAt DateTime         @default(now())

  // Relations
  user User @relation(fields: [userId], references: [id])

  @@map("notifications")
}

model Task {
  id          String     @id @default(cuid())
  userId      String
  type        TaskType
  title       String
  description String
  dueDate     DateTime
  isCompleted Boolean    @default(false)
  createdAt   DateTime   @default(now())
  completedAt DateTime?

  // Relations
  user User @relation(fields: [userId], references: [id])

  @@map("tasks")
}

enum UserRole {
  SUPER_ADMIN
  MANAGER
  FIELD_OFFICER
}

enum PathwayType {
  PURCHASING
  SEED_GERMINATION
  CUTTING_GERMINATION
  OUT_SOURCING
}

enum BatchStatus {
  CREATED
  IN_PROGRESS
  READY
  DELIVERED
  CANCELLED
}

enum BatchStage {
  INITIAL
  PROPAGATION
  SHADE_60
  SHADE_80
  GROWING
  HARDENING
  RE_POTTING
  PHYTOSANITARY
}

enum NotificationType {
  MEASUREMENT_DUE
  BATCH_READY
  TASK_ASSIGNED
  SYSTEM_ALERT
}

enum TaskType {
  MEASUREMENT
  STAGE_TRANSITION
  MAINTENANCE
  INSPECTION
}
```

### Step 1.4: Environment Configuration

Frontend `.env.local`:
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
API_BASE_URL=http://localhost:5000/api
```

Backend `.env`:
```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://username:password@localhost:5432/luminex_plant
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=luminex-plant-files

# Email Configuration
EMAIL_FROM=noreply@luminexplant.com
AWS_SES_REGION=us-east-1
```

## 📊 Step 2: Database Setup and Migrations

### Step 2.1: Initialize Database

```bash
# In backend directory
npx prisma migrate dev --name initial
npx prisma generate
```

### Step 2.2: Seed Data Script

Create `prisma/seed.ts`:
```typescript
import { PrismaClient, UserRole, PathwayType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create Super Admin
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@luminexplant.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.SUPER_ADMIN,
    },
  })

  // Create Sample Species
  const species = await prisma.species.createMany({
    data: [
      {
        name: 'Rose',
        scientificName: 'Rosa rubiginosa',
        targetGirth: 5.0,
        targetHeight: 30.0,
      },
      {
        name: 'Orchid',
        scientificName: 'Orchidaceae',
        targetGirth: 2.5,
        targetHeight: 15.0,
      },
      {
        name: 'Fern',
        scientificName: 'Polypodiopsida',
        targetGirth: 3.0,
        targetHeight: 25.0,
      },
    ],
  })

  // Create Sample Zones
  const zone1 = await prisma.zone.create({
    data: {
      name: 'Zone A',
      capacity: 1000,
    },
  })

  const zone2 = await prisma.zone.create({
    data: {
      name: 'Zone B',
      capacity: 1500,
    },
  })

  // Create Sample Beds
  await prisma.bed.createMany({
    data: [
      { name: 'Bed A1', capacity: 200, zoneId: zone1.id },
      { name: 'Bed A2', capacity: 300, zoneId: zone1.id },
      { name: 'Bed A3', capacity: 500, zoneId: zone1.id },
      { name: 'Bed B1', capacity: 400, zoneId: zone2.id },
      { name: 'Bed B2', capacity: 600, zoneId: zone2.id },
      { name: 'Bed B3', capacity: 500, zoneId: zone2.id },
    ],
  })

  console.log('Seed data created successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

Run seed:
```bash
npx prisma db seed
```

## 🔐 Step 3: Authentication & Security

### Step 3.1: Backend Auth Middleware

Create `src/middleware/auth.middleware.ts`:
```typescript
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    role: UserRole
  }
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return res.status(401).json({ error: 'Access token required' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, isActive: true }
    })

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    req.user = user
    next()
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' })
  }
}

export const authorize = (roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    next()
  }
}
```

### Step 3.2: Rate Limiting Middleware

Create `src/middleware/rateLimiter.middleware.ts`:
```typescript
import rateLimit from 'express-rate-limit'
import RedisStore from 'rate-limit-redis'
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL!)

export const createRateLimiter = (
  windowMs: number,
  max: number,
  message: string = 'Too many requests'
) => {
  return rateLimit({
    store: new RedisStore({
      sendCommand: (...args: string[]) => redis.call(...args),
    }),
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
  })
}

// API rate limiting
export const apiLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests per windowMs
  'Too many API requests, please try again later'
)

// Auth rate limiting
export const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts per windowMs
  'Too many authentication attempts, please try again later'
)

// Data entry rate limiting
export const dataEntryLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  30, // 30 requests per minute
  'Too many data entries, please slow down'
)
```

### Step 3.3: Input Validation Middleware

Create `src/middleware/validation.middleware.ts`:
```typescript
import { Request, Response, NextFunction } from 'express'
import { body, validationResult, param, query } from 'express-validator'
import validator from 'validator'

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    })
  }
  next()
}

// Sanitize and validate common inputs
export const sanitizeInput = (value: string): string => {
  return validator.escape(validator.trim(value))
}

// User validation rules
export const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, number and special character'),
  body('firstName')
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-zA-Z\s]+$/)
    .customSanitizer(sanitizeInput)
    .withMessage('First name must be 2-50 characters, letters only'),
  body('lastName')
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-zA-Z\s]+$/)
    .customSanitizer(sanitizeInput)
    .withMessage('Last name must be 2-50 characters, letters only'),
  handleValidationErrors
]

// Species validation rules
export const validateSpecies = [
  body('name')
    .isLength({ min: 2, max: 100 })
    .matches(/^[a-zA-Z\s]+$/)
    .customSanitizer(sanitizeInput)
    .withMessage('Species name must be 2-100 characters, letters only'),
  body('scientificName')
    .optional()
    .isLength({ max: 200 })
    .customSanitizer(sanitizeInput),
  body('targetGirth')
    .isFloat({ min: 0.1, max: 100 })
    .withMessage('Target girth must be between 0.1 and 100 cm'),
  body('targetHeight')
    .isFloat({ min: 1, max: 1000 })
    .withMessage('Target height must be between 1 and 1000 cm'),
  handleValidationErrors
]

// Batch validation rules
export const validateBatch = [
  body('customName')
    .optional()
    .isLength({ max: 100 })
    .customSanitizer(sanitizeInput),
  body('speciesId')
    .isUUID()
    .withMessage('Valid species ID is required'),
  body('initialQty')
    .isInt({ min: 1, max: 10000 })
    .withMessage('Initial quantity must be between 1 and 10,000'),
  body('pathway')
    .isIn(['PURCHASING', 'SEED_GERMINATION', 'CUTTING_GERMINATION', 'OUT_SOURCING'])
    .withMessage('Valid pathway is required'),
  handleValidationErrors
]

// Measurement validation rules
export const validateMeasurement = [
  body('batchId')
    .isUUID()
    .withMessage('Valid batch ID is required'),
  body('girth')
    .isFloat({ min: 0.1, max: 100 })
    .withMessage('Girth must be between 0.1 and 100 cm'),
  body('height')
    .isFloat({ min: 1, max: 1000 })
    .withMessage('Height must be between 1 and 1000 cm'),
  body('sampleSize')
    .isInt({ min: 1, max: 100 })
    .withMessage('Sample size must be between 1 and 100'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .customSanitizer(sanitizeInput),
  handleValidationErrors
]
```

## 📱 Step 4: Frontend Components

### Step 4.1: Layout Components

Create `src/components/layouts/DashboardLayout.tsx`:
```typescript
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Menu, Bell, LogOut, User } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface DashboardLayoutProps {
  children: React.ReactNode
  sidebar: React.ReactNode
}

export function DashboardLayout({ children, sidebar }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { data: session } = useSession()

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-25 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebar}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">
                LuminexPlant
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="h-5 w-5" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <User className="h-5 w-5" />
                    <span className="ml-2 hidden sm:inline">
                      {session?.user?.name}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4">
          {children}
        </main>
      </div>
    </div>
  )
}
```

### Step 4.2: Measurement Unit Conversion

Create `src/lib/units.ts`:
```typescript
export enum LengthUnit {
  CM = 'cm',
  MM = 'mm',
  INCH = 'inch',
  METER = 'm'
}

export const UNIT_CONVERSIONS = {
  [LengthUnit.CM]: {
    [LengthUnit.MM]: (value: number) => value * 10,
    [LengthUnit.INCH]: (value: number) => value / 2.54,
    [LengthUnit.METER]: (value: number) => value / 100,
    [LengthUnit.CM]: (value: number) => value,
  },
  [LengthUnit.MM]: {
    [LengthUnit.CM]: (value: number) => value / 10,
    [LengthUnit.INCH]: (value: number) => value / 25.4,
    [LengthUnit.METER]: (value: number) => value / 1000,
    [LengthUnit.MM]: (value: number) => value,
  },
  [LengthUnit.INCH]: {
    [LengthUnit.CM]: (value: number) => value * 2.54,
    [LengthUnit.MM]: (value: number) => value * 25.4,
    [LengthUnit.METER]: (value: number) => value * 0.0254,
    [LengthUnit.INCH]: (value: number) => value,
  },
  [LengthUnit.METER]: {
    [LengthUnit.CM]: (value: number) => value * 100,
    [LengthUnit.MM]: (value: number) => value * 1000,
    [LengthUnit.INCH]: (value: number) => value / 0.0254,
    [LengthUnit.METER]: (value: number) => value,
  },
}

export const convertLength = (
  value: number,
  fromUnit: LengthUnit,
  toUnit: LengthUnit
): number => {
  const converter = UNIT_CONVERSIONS[fromUnit]?.[toUnit]
  if (!converter) {
    throw new Error(`Conversion from ${fromUnit} to ${toUnit} not supported`)
  }
  return Number(converter(value).toFixed(2))
}

export const formatLength = (
  value: number,
  unit: LengthUnit,
  precision: number = 2
): string => {
  return `${value.toFixed(precision)} ${unit}`
}

// Predefined measurement ranges in CM (stored in database)
export const GIRTH_RANGES = [
  { label: '0.5-1.0 cm', min: 0.5, max: 1.0 },
  { label: '1.0-1.5 cm', min: 1.0, max: 1.5 },
  { label: '1.5-2.0 cm', min: 1.5, max: 2.0 },
  { label: '2.0-2.5 cm', min: 2.0, max: 2.5 },
  { label: '2.5-3.0 cm', min: 2.5, max: 3.0 },
  { label: '3.0-4.0 cm', min: 3.0, max: 4.0 },
  { label: '4.0-5.0 cm', min: 4.0, max: 5.0 },
  { label: '5.0-7.5 cm', min: 5.0, max: 7.5 },
  { label: '7.5-10.0 cm', min: 7.5, max: 10.0 },
  { label: '10.0+ cm', min: 10.0, max: 999 },
]

export const HEIGHT_RANGES = [
  { label: '5-10 cm', min: 5, max: 10 },
  { label: '10-15 cm', min: 10, max: 15 },
  { label: '15-20 cm', min: 15, max: 20 },
  { label: '20-25 cm', min: 20, max: 25 },
  { label: '25-30 cm', min: 25, max: 30 },
  { label: '30-40 cm', min: 30, max: 40 },
  { label: '40-50 cm', min: 40, max: 50 },
  { label: '50-75 cm', min: 50, max: 75 },
  { label: '75-100 cm', min: 75, max: 100 },
  { label: '100+ cm', min: 100, max: 9999 },
]

export const getRangeOptions = (
  ranges: typeof GIRTH_RANGES,
  displayUnit: LengthUnit
) => {
  return ranges.map(range => ({
    value: `${range.min}-${range.max}`,
    label: `${formatLength(convertLength(range.min, LengthUnit.CM, displayUnit), displayUnit)} - ${formatLength(convertLength(range.max, LengthUnit.CM, displayUnit), displayUnit)}`,
    min: range.min,
    max: range.max,
  }))
}
```

## 🔧 Step 5: API Endpoints

### Step 5.1: Batch Controller

Create `src/controllers/batch.controller.ts`:
```typescript
import { Request, Response } from 'express'
import { PrismaClient, PathwayType, BatchStage } from '@prisma/client'
import { generateBatchNumber } from '../utils/batchUtils'
import { logAuditAction } from '../utils/auditUtils'

const prisma = new PrismaClient()

interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
  }
}

export const createBatch = async (req: AuthRequest, res: Response) => {
  try {
    const { speciesId, initialQty, pathway, customName } = req.body
    const userId = req.user!.id

    // Verify species exists
    const species = await prisma.species.findUnique({
      where: { id: speciesId }
    })

    if (!species) {
      return res.status(404).json({ error: 'Species not found' })
    }

    // Generate unique batch number
    const batchNumber = await generateBatchNumber(pathway)

    const batch = await prisma.batch.create({
      data: {
        batchNumber,
        customName,
        pathway,
        speciesId,
        initialQty,
        currentQty: initialQty,
        createdById: userId,
        stage: BatchStage.INITIAL
      },
      include: {
        species: true,
        createdBy: {
          select: { firstName: true, lastName: true }
        }
      }
    })

    // Log audit action
    await logAuditAction(userId, 'CREATE_BATCH', null, batch, batch.id)

    // Create initial stage history
    await prisma.stageHistory.create({
      data: {
        batchId: batch.id,
        toStage: BatchStage.INITIAL,
        quantity: initialQty
      }
    })

    res.status(201).json(batch)
  } catch (error) {
    console.error('Create batch error:', error)
    res.status(500).json({ error: 'Failed to create batch' })
  }
}

export const getBatches = async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = '1',
      limit = '10',
      stage,
      status,
      speciesId,
      search
    } = req.query

    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const skip = (pageNum - 1) * limitNum

    const where: any = {}

    if (stage) where.stage = stage
    if (status) where.status = status
    if (speciesId) where.speciesId = speciesId
    if (search) {
      where.OR = [
        { batchNumber: { contains: search, mode: 'insensitive' } },
        { customName: { contains: search, mode: 'insensitive' } },
        { species: { name: { contains: search, mode: 'insensitive' } } }
      ]
    }

    const [batches, total] = await Promise.all([
      prisma.batch.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          species: true,
          zone: true,
          bed: true,
          createdBy: {
            select: { firstName: true, lastName: true }
          },
          _count: {
            select: { measurements: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.batch.count({ where })
    ])

    res.json({
      data: batches,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    })
  } catch (error) {
    console.error('Get batches error:', error)
    res.status(500).json({ error: 'Failed to fetch batches' })
  }
}

export const updateBatchStage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { stage, zoneId, bedId, quantity, notes } = req.body
    const userId = req.user!.id

    const batch = await prisma.batch.findUnique({
      where: { id },
      include: { bed: true }
    })

    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' })
    }

    // If moving to growing stage, validate zone and bed
    if (stage === BatchStage.GROWING) {
      if (!zoneId || !bedId) {
        return res.status(400).json({ 
          error: 'Zone and bed are required for growing stage' 
        })
      }

      const bed = await prisma.bed.findUnique({
        where: { id: bedId },
        include: { zone: true }
      })

      if (!bed) {
        return res.status(404).json({ error: 'Bed not found' })
      }

      // Check bed capacity
      const currentOccupancy = await prisma.batch.aggregate({
        where: {
          bedId: bedId,
          stage: BatchStage.GROWING,
          id: { not: id }
        },
        _sum: { currentQty: true }
      })

      const occupiedSpace = currentOccupancy._sum.currentQty || 0
      const availableSpace = bed.capacity - occupiedSpace

      if (quantity > availableSpace) {
        return res.status(400).json({
          error: `Insufficient bed capacity. Available: ${availableSpace}, Required: ${quantity}`
        })
      }
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update old bed occupancy if changing beds
      if (batch.bedId && batch.bedId !== bedId) {
        await tx.bed.update({
          where: { id: batch.bedId },
          data: {
            occupied: {
              decrement: batch.currentQty
            }
          }
        })
      }

      // Update new bed occupancy
      if (bedId && bedId !== batch.bedId) {
        await tx.bed.update({
          where: { id: bedId },
          data: {
            occupied: {
              increment: quantity
            }
          }
        })
      }

      // Update batch
      const updatedBatch = await tx.batch.update({
        where: { id },
        data: {
          stage,
          zoneId,
          bedId,
          currentQty: quantity,
          updatedAt: new Date()
        },
        include: {
          species: true,
          zone: true,
          bed: true
        }
      })

      // Create stage history
      await tx.stageHistory.create({
        data: {
          batchId: id,
          fromStage: batch.stage,
          toStage: stage,
          quantity,
          notes
        }
      })

      return updatedBatch
    })

    // Log audit action
    await logAuditAction(userId, 'UPDATE_BATCH_STAGE', batch, result, id)

    res.json(result)
  } catch (error) {
    console.error('Update batch stage error:', error)
    res.status(500).json({ error: 'Failed to update batch stage' })
  }
}
```

### Step 5.2: Utility Functions

Create `src/utils/batchUtils.ts`:
```typescript
import { PrismaClient, PathwayType } from '@prisma/client'

const prisma = new PrismaClient()

export const generateBatchNumber = async (pathway: PathwayType): Promise<string> => {
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2)
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')

  const pathwayCode = {
    PURCHASING: 'PU',
    SEED_GERMINATION: 'SG',
    CUTTING_GERMINATION: 'CG',
    OUT_SOURCING: 'OS'
  }[pathway]

  const datePrefix = `${pathwayCode}${year}${month}${day}`

  // Find the highest sequence number for today
  const lastBatch = await prisma.batch.findFirst({
    where: {
      batchNumber: {
        startsWith: datePrefix
      }
    },
    orderBy: {
      batchNumber: 'desc'
    }
  })

  let sequence = 1
  if (lastBatch) {
    const lastSequence = parseInt(lastBatch.batchNumber.slice(-3))
    sequence = lastSequence + 1
  }

  return `${datePrefix}${sequence.toString().padStart(3, '0')}`
}

export const calculateReadyDate = async (batchId: string): Promise<Date | null> => {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      species: true,
      measurements: {
        orderBy: { createdAt: 'desc' },
        take: 5 // Last 5 measurements for trend analysis
      }
    }
  })

  if (!batch || batch.measurements.length < 2) {
    return null
  }

  const { species, measurements } = batch
  const targetGirth = species.targetGirth
  const targetHeight = species.targetHeight

  // Calculate growth rates
  const sortedMeasurements = measurements.sort((a, b) => 
    a.createdAt.getTime() - b.createdAt.getTime()
  )

  const firstMeasurement = sortedMeasurements[0]
  const lastMeasurement = sortedMeasurements[sortedMeasurements.length - 1]

  const daysDiff = Math.max(1, 
    (lastMeasurement.createdAt.getTime() - firstMeasurement.createdAt.getTime()) / 
    (1000 * 60 * 60 * 24)
  )

  const girthGrowthRate = (lastMeasurement.girth - firstMeasurement.girth) / daysDiff
  const heightGrowthRate = (lastMeasurement.height - firstMeasurement.height) / daysDiff

  // Calculate days needed to reach targets
  const girthDaysNeeded = girthGrowthRate > 0 ? 
    Math.ceil((targetGirth - lastMeasurement.girth) / girthGrowthRate) : Infinity

  const heightDaysNeeded = heightGrowthRate > 0 ? 
    Math.ceil((targetHeight - lastMeasurement.height) / heightGrowthRate) : Infinity

  // Use the longer timeline
  const daysNeeded = Math.max(girthDaysNeeded, heightDaysNeeded)

  if (daysNeeded === Infinity || daysNeeded < 0) {
    return null
  }

  const readyDate = new Date()
  readyDate.setDate(readyDate.getDate() + daysNeeded)

  return readyDate
}
```

## 📊 Step 6: Analytics & Charts

Create `src/components/charts/GrowthChart.tsx`:
```typescript
'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { format } from 'date-fns'

interface Measurement {
  id: string
  girth: number
  height: number
  createdAt: string
}

interface GrowthChartProps {
  measurements: Measurement[]
  targetGirth: number
  targetHeight: number
}

export function GrowthChart({ measurements, targetGirth, targetHeight }: GrowthChartProps) {
  const chartData = measurements.map((measurement, index) => ({
    date: format(new Date(measurement.createdAt), 'MMM dd'),
    girth: measurement.girth,
    height: measurement.height,
    targetGirth,
    targetHeight,
    week: index + 1
  }))

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip 
            formatter={(value, name) => [
              `${value} cm`,
              name === 'girth' ? 'Girth' : 
              name === 'height' ? 'Height' :
              name === 'targetGirth' ? 'Target Girth' : 'Target Height'
            ]}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="girth"
            stroke="#8884d8"
            strokeWidth={2}
            dot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="height"
            stroke="#82ca9d"
            strokeWidth={2}
            dot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="targetGirth"
            stroke="#ff7300"
            strokeDasharray="5 5"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="targetHeight"
            stroke="#ff0000"
            strokeDasharray="5 5"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

## 🐳 Step 7: Docker Configuration

### Step 7.1: Frontend Dockerfile

Create `luminex-plant-frontend/Dockerfile`:
```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Change ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Step 7.2: Backend Dockerfile

Create `luminex-plant-backend/Dockerfile`:
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies for Prisma
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 5000

CMD ["npm", "start"]
```

### Step 7.3: Docker Compose

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: luminex_plant
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

  backend:
    build: ./luminex-plant-backend
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://postgres:password@postgres:5432/luminex_plant
      REDIS_URL: redis://redis:6379
      JWT_SECRET: your-secret-key
    depends_on:
      - postgres
      - redis
    ports:
      - "5000:5000"
    volumes:
      - ./luminex-plant-backend:/app
      - /app/node_modules

  frontend:
    build: ./luminex-plant-frontend
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:5000/api
    depends_on:
      - backend
    ports:
      - "3000:3000"
    volumes:
      - ./luminex-plant-frontend:/app
      - /app/node_modules
      - /app/.next

volumes:
  postgres_data:
  redis_data:
```

## 🚀 Step 8: Deployment & DevOps

### Step 8.1: GitHub Actions CI/CD

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: '**/package-lock.json'

      - name: Install backend dependencies
        working-directory: ./luminex-plant-backend
        run: npm ci

      - name: Install frontend dependencies
        working-directory: ./luminex-plant-frontend
        run: npm ci

      - name: Run backend tests
        working-directory: ./luminex-plant-backend
        run: npm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db

      - name: Run frontend tests
        working-directory: ./luminex-plant-frontend
        run: npm test

      - name: Build frontend
        working-directory: ./luminex-plant-frontend
        run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Deploy to EC2
        run: |
          # Add deployment script here
          echo "Deploying to EC2..."
```

## 🧪 Step 9: Testing Strategy

### Step 9.1: Backend Unit Tests

Create `luminex-plant-backend/tests/batch.test.ts`:
```typescript
import request from 'supertest'
import { app } from '../src/app'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('Batch API', () => {
  let authToken: string
  let speciesId: string

  beforeAll(async () => {
    // Setup test data
    const species = await prisma.species.create({
      data: {
        name: 'Test Rose',
        targetGirth: 5.0,
        targetHeight: 30.0
      }
    })
    speciesId = species.id

    // Login and get token
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@luminexplant.com',
        password: 'admin123'
      })
    
    authToken = response.body.token
  })

  afterAll(async () => {
    // Cleanup test data
    await prisma.batch.deleteMany({})
    await prisma.species.deleteMany({})
    await prisma.$disconnect()
  })

  describe('POST /api/batches', () => {
    it('should create a new batch', async () => {
      const batchData = {
        speciesId,
        initialQty: 100,
        pathway: 'PURCHASING',
        customName: 'Test Batch'
      }

      const response = await request(app)
        .post('/api/batches')
        .set('Authorization', `Bearer ${authToken}`)
        .send(batchData)

      expect(response.status).toBe(201)
      expect(response.body.batchNumber).toBeDefined()
      expect(response.body.currentQty).toBe(100)
      expect(response.body.pathway).toBe('PURCHASING')
    })

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/batches')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Validation failed')
    })

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/batches')
        .send({
          speciesId,
          initialQty: 100,
          pathway: 'PURCHASING'
        })

      expect(response.status).toBe(401)
    })
  })
})
```

## 📋 Step 10: Development Checklist

### Phase 1 Checklist (Weeks 1-8)
- [ ] Project setup complete
- [ ] Database schema implemented
- [ ] Authentication system working
- [ ] Basic CRUD operations for all entities
- [ ] User role management
- [ ] Basic responsive UI
- [ ] Input validation and sanitization
- [ ] Rate limiting implemented
- [ ] Docker configuration
- [ ] Basic testing suite

### Phase 2 Checklist (Weeks 9-16)
- [ ] Growth tracking system
- [ ] Measurement dropdowns with ranges
- [ ] Unit conversion system
- [ ] Analytics dashboard
- [ ] Chart visualizations
- [ ] Notification system
- [ ] Email service integration
- [ ] Reporting system
- [ ] PDF/Excel export
- [ ] Performance optimization

### Phase 3 Checklist (Weeks 17-24)
- [ ] Predictive modeling
- [ ] Historical data analysis
- [ ] Growth forecasting
- [ ] Ready date predictions
- [ ] Advanced analytics
- [ ] System optimization
- [ ] Security hardening
- [ ] Load testing
- [ ] Complete testing suite
- [ ] Documentation

## 🔒 Security Checklist

- [ ] SQL injection prevention with Prisma
- [ ] Input validation and sanitization
- [ ] Rate limiting implemented
- [ ] Authentication middleware
- [ ] Role-based access control
- [ ] Secure password hashing
- [ ] Environment variables secured
- [ ] HTTPS enforced
- [ ] CORS configured properly
- [ ] Security headers implemented

## 🚀 Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations deployed
- [ ] AWS services configured
- [ ] SSL certificates installed
- [ ] Monitoring and logging setup
- [ ] Backup strategy implemented
- [ ] CI/CD pipeline working
- [ ] Load balancer configured
- [ ] Auto-scaling enabled
- [ ] Health checks implemented

---

This comprehensive guide provides everything needed to implement the LuminexPlant system. Follow each step precisely, test thoroughly, and maintain the highest code quality standards throughout development.
