# SmartBiz — Web-Based POS & Inventory Management System

## Overview

SmartBiz is a production-ready, web-based Integrated Point-of-Sale (POS), Multi-Branch Inventory Management, and Demand Forecasting System built with Next.js 14, TypeScript, and PostgreSQL.

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, Shadcn UI, Recharts, Lucide React |
| **Backend** | Next.js API Routes, Server Actions |
| **Database** | PostgreSQL with Prisma ORM |
| **Auth** | NextAuth.js (Credentials + JWT) |
| **Hardware** | html5-qrcode (barcode scanner), react-to-print (receipt printing) |

## Features

### 1. POS Terminal (`/pos`)
- Touch-friendly product grid with category filters
- Live barcode scanning via camera
- Cart management with quantity controls
- Multiple payment methods (Cash, GCash, PayMaya, Card)
- Automatic receipt generation and printing
- Real-time stock validation

### 2. Product Management (`/inventory`)
- Full CRUD: Add, Edit, Delete products
- Customizable variants (Size, Color, Material)
- Multiple product images
- Barcode generation and tracking
- Low-stock alerts and reorder levels
- Multi-branch inventory tracking

### 3. Analytics & Forecasting (`/analytics`, `/dashboard`)
- KPI cards: Revenue, Profit, Stock Value, Stockout Alerts
- Sales trend charts (90-day history)
- Demand forecasting using Exponential Smoothing
- Stock reorder recommendations
- Configurable forecast periods (7-90 days)

### 4. User Roles (RBAC)
- **Admin**: Full system access, branch/user management
- **Manager**: Inventory management, reports, purchase orders
- **Cashier**: POS terminal access only

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (or Supabase account)

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your database URL and secrets


## Database Schema

```
Branch ──< User
Branch ──< Inventory >── Product ──< Category
Product ──< Variant
Product ──< Image
Product ──< SaleItem >── Sale
```

## Deployment to Vercel (Making It Web-Based)

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/smartbiz.git
git push -u origin main
```

### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click **"New Project"**
3. Import your GitHub repository
4. Vercel auto-detects Next.js — click **"Deploy"**
5. Wait 2-3 minutes for build to complete

### Step 3: Set Up Database (Supabase)
1. Go to [supabase.com](https://supabase.com) → New Project
2. Copy the database URL
3. In Vercel → Project Settings → Environment Variables:
   - `DATABASE_URL` = your Supabase connection string
   - `NEXTAUTH_SECRET` = generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL` = your Vercel URL (e.g., `https://smartbiz.vercel.app`)

### Step 4: Initialize Database
```bash
npx prisma db push
npm run db:seed
```

### Step 5: Custom Domain (Optional)
1. Vercel → Project Settings → Domains
2. Add your domain (e.g., `pos.yourstore.com`)
3. Update DNS records as instructed

### Result
Your POS system is now accessible at `https://smartbiz.vercel.app` from any device with a browser — PC, tablet, or phone!

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sales` | Process checkout transaction |
| GET | `/api/sales/list` | Get sales history |
| POST | `/api/products` | Create new product |
| GET | `/api/products` | List products (paginated) |
| GET | `/api/products/[id]` | Get single product |
| PUT | `/api/products/[id]` | Update product |
| DELETE | `/api/products/[id]` | Soft-delete product |
| GET | `/api/analytics/forecast` | KPIs + sales trends + forecasts |

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── pos/page.tsx
│   │   ├── inventory/page.tsx
│   │   └── analytics/page.tsx
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── sales/route.ts
│       ├── products/route.ts
│       └── analytics/forecast/route.ts
├── components/
│   ├── ui/           # Button, Card, Input, Table, Dialog, Select
│   ├── pos/          # ProductGrid, CartSidebar, PaymentModal, Receipt
│   └── dashboard/    # Sidebar, KPICards, SalesForecastChart
├── lib/
│   ├── prisma.ts     # Database client
│   ├── auth.ts       # NextAuth config
│   └── utils.ts      # Helpers
└── types/
    └── index.ts      # TypeScript interfaces
```

## License

MIT License

# 3. Generate Prisma client and create tables
npx prisma generate
npx prisma db push

# 4. Seed demo data
npm run db:seed

# 5. Start development server
npm run dev
```

### Demo Credentials
- **Admin**: admin@smartbiz.com / admin123
- **Cashier**: cashier@smartbiz.com / cashier123
