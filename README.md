# Cattle Feed Inventory Management System

Complete inventory management system for cattle feed businesses built with Vite + React + Express.js + MongoDB.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

### Installation

1. **Install dependencies**
   ```bash
   npm run install:all
   ```

2. **Environment Setup**
   - Copy `.env` to create your local environment file
   - Update `JWT_SECRET` for production use

3. **Start Development**
   ```bash
   npm run dev
   ```
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5000
   - MongoDB Keep-alive: http://localhost:5000/ping-db

## 🏗️ Project Structure

```
├── backend/          # Express.js API server
│   ├── models/       # MongoDB schemas
│   ├── routes/       # API routes
│   └── middleware/   # Auth & validation
├── frontend/         # Vite + React app
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Page components
│   │   ├── contexts/    # React contexts
│   │   └── lib/         # Utilities & API
└── .env             # Environment variables
```

## 🎨 Features

### ✅ Authentication System
- Login/Signup with tabs
- JWT-based authentication
- User session management

### ✅ Company Management
- Create new company
- Join existing company (via code)
- Company setup flow

### ✅ Dashboard
- Real-time statistics
- Low stock alerts
- Inventory overview

### ✅ Warehouse Management
- Add/edit/delete warehouses
- Location and capacity tracking

### ✅ Stock Inventory
- Multi-category stock items
- Quantity tracking
- Low stock alerts
- Cost and selling price management

### ✅ Sales Management
- Record sales transactions
- Automatic stock deduction
- Revenue tracking
- Client management

### ✅ MongoDB Keep-alive
- `/ping-db` endpoint to prevent cluster pausing
- Ready for uptime monitoring

## 🎨 Design System

### Color Scheme (HSL)
- **Primary**: `hsl(145, 60%, 35%)` - Professional agricultural green
- **Secondary**: `hsl(145, 25%, 92%)` - Light green tint
- **Accent**: `hsl(35, 85%, 55%)` - Orange accent
- **Background**: `hsl(0, 0%, 100%)` - Pure white
- **Success**: `hsl(145, 65%, 40%)`
- **Warning**: `hsl(35, 95%, 55%)`
- **Destructive**: `hsl(0, 72%, 51%)`

### Typography
- System font stack (Tailwind defaults)
- Page titles: `text-3xl font-bold tracking-tight`
- Descriptions: `text-muted-foreground mt-1`

## 🚀 Deployment

### Backend (Render/Railway)
```bash
cd backend
npm install
npm start
```

### Frontend (Vercel/Netlify)
```bash
cd frontend
npm install
npm run build
```

### Environment Variables
```env
MONGO_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-frontend-domain.com
```

## 📊 Database Schema

### Collections
- **users**: Authentication and profiles
- **companies**: Company information and codes
- **warehouses**: Storage locations
- **stockitems**: Inventory items with categories
- **sales**: Sales transactions

### Features
- Automatic company code generation (`CFX-12345`)
- Stock quantity validation
- Automatic stock deduction on sales
- Low stock alerts

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me`

### Company
- `POST /api/company/create`
- `POST /api/company/join`
- `GET /api/company`

### Warehouses
- `GET /api/warehouses`
- `POST /api/warehouses`
- `PUT /api/warehouses/:id`
- `DELETE /api/warehouses/:id`

### Stock
- `GET /api/stock`
- `POST /api/stock`
- `PUT /api/stock/:id`
- `DELETE /api/stock/:id`

### Sales
- `GET /api/sales`
- `POST /api/sales`
- `GET /api/sales/revenue`

### Dashboard
- `GET /api/dashboard/stats`
- `GET /api/dashboard/low-stock`

## 🔄 Keep-alive Setup

For MongoDB Atlas clusters, set up uptime monitoring:

1. Deploy backend to Render/Railway
2. Use UptimeRobot or similar service
3. Monitor: `https://your-backend-url.com/ping-db`
4. Check every 5-10 minutes

## 📱 Responsive Design

- Mobile-first approach
- Collapsible sidebar navigation
- Touch-friendly interface
- Optimized for tablets and phones

## 🛡️ Security

- JWT authentication
- Password hashing (bcrypt)
- Input validation
- CORS configuration
- Environment variable protection

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - see LICENSE file for details
