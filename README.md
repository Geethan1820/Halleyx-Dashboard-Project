# 📊 Custom Dashboard Builder (Halleyx Compliance II)

A premium, full-stack analytics platform for managing customer orders and building high-performance monitoring dashboards. Re-engineered to comply **100%** with the **Halleyx Full Stack Engineer Challenge II (2026)** requirements.

## ✨ Key Features (Halleyx Compliance)

### 📝 Strict Form Validation
- **Mandatory Fields**: All 15+ Customer Order fields are strictly mandatory.
- **Exact Messages**: Displays the exact required error message: `"Please fill the field"`.
- **Validation Rules**: Enforces Quantity $\ge 1$, Unit Price $> 0$, and valid decimal precision.
- **Delete Confirmation**: Standardized popup for all deletions: `"Are you sure you want to delete this item?"`.

### 🧩 Advanced Widget Ecosystem
- **Smart Tables**: 
  - **Dynamic Pagination**: Choose between 5, 10, or 15 records per page.
  - **Interactive Sorting**: Multi-column sorting for all data fields.
  - **Live Multi-Filter**: Add and chain multiple filters to refine table data in real-time.
- **Interactive Charts**:
  - **Drill-Down System**: Clicking chart segments opens a detailed modal with filtered records.
  - **Visual Export**: Download individual charts as high-resolution PNG images.
- **KPI Cards**: Support for 5 aggregation types (Sum, Avg, Count, Min, Max) with custom formatting.

### 🌐 Global Filtering & State
- **Unified Controls**: Date range, Country, and Price range filters apply globally to all widgets.
- **Persistent State**: Filters maintain their state across interactions and reflect in drill-down views.
- **Read-Only Sharing**: Generate secure, read-only links for live dashboard preview.

### 🔐 Secure Access & Real-Time Sync
- **JWT Authentication**: Full registration and login flow with secure session handling.
- **WebSocket Protocol**: Integrated `socket.io` for zero-latency synchronization of orders and layouts.
- **AI Insights**: NLP-driven query engine (e.g., "Top 5 products in USA") and automated trend analysis.

### 📐 Halleyx-Spec Grid System
- **Strict Column Grid**: Desktop (12), Tablet (8), and Mobile (4) responsive layouts.
- **Separate Config Page**: Dedicated environment for drag-and-drop dashboard construction.

## 🚀 Getting Started

### 1. Backend Setup
```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🔗 Project Links
- **GitHub Repository**: [Geethan1820/Halleyx-Dashboard-Project](https://github.com/Geethan1820/Halleyx-Dashboard-Project)
- **Demo Video**: [Full Compliance Showcase](https://drive.google.com/file/d/1qKztOo0gXWVNRwFwnvWZvMzAJ9PjPlVJ/view?usp=drive_link)

---
*Developed for Halleyx Competition Excellence (2026).*

