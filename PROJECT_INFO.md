# Halleyx Dashboard Project Info 🌟

Welcome to the **Halleyx Dashboard Project**! This document explains the entire project in very simple, easy-to-understand English. It describes how all files work, what different sections do, and how they connect to make a real-time, AI-powered interactive dashboard.

---

## 📂 Overall Folder Structure

The project is split into two major parts:
1. **`backend`**: The brain that runs on the server. It manages the database, authenticates users, processes natural language search queries, and broadcasts real-time updates.
2. **`frontend`**: The user interface (what you see in the browser). It draws the live charts, lets you drag and drop widgets, handles configuration settings, and hosts the premium AI Insights panel.

```
Halleyx-Dashboard-Project-main
 ├── backend/               # Server-side TypeScript code
 │    ├── prisma/           # Database setup and SQLite data models
 │    └── src/
 │         ├── server.ts    # Main entry point (API Endpoints, WebSockets)
 │         └── test-prisma.ts
 └── frontend/              # Web application code (React + Vite)
      ├── src/
      │    ├── components/  # Reusable user interface components (Grid, Modals)
      │    ├── context/     # Global state managers (Auth, Tokens)
      │    ├── hooks/       # Custom utility helpers (Toasts)
      │    ├── lib/         # API connection helpers, PDF/PNG exporters
      │    ├── pages/       # Different pages (Login, Orders, Dashboard, Configure)
      │    └── types/       # TypeScript type descriptions
      └── package.json
```

---

## ⚙️ The Backend System (`backend/`)

The backend is built with **Node.js, Express, TypeScript, SQLite, and Prisma ORM**.

### 🗄️ Database Models (`backend/prisma/schema.prisma`)
The system stores information in a light SQLite database file using three tables:
1. **`User`**: Stores who is registered. Includes `id`, `name`, `email` (login), and encrypted `password`.
2. **`Order`**: Stores individual sales orders. Includes buyer info (`firstName`, `lastName`, `email`), product info (`product`, `quantity`, `unitPrice`, `totalAmount`), fulfillment `status` (Pending, Processing, Delivered), and a creation timestamp.
3. **`Dashboard`**: Stores the layout of the builder. It serializes the grids and configuration options as a JSON text block so your charts stay exactly where you placed them when you reload the page.

### 🌐 Server Endpoints (`backend/src/server.ts`)
The server runs on port `3000` and serves the following simple API endpoints:

#### Auth Sections
* **`POST /register`**: Creates a new user account, encrypts passwords using `bcryptjs`, and saves them to the database.
* **`POST /login`**: Verifies username/password credentials. If correct, it returns a secure token called a JSON Web Token (JWT) so the frontend can securely call other endpoints.

#### Orders Sections
* **`GET /orders`**: Retrieves a list of all sales orders.
* **`POST /orders`**: Creates a new sales order. Calculates total prices (`quantity * unitPrice`) on the spot and broadcasts the new order to all connected web clients in real-time.
* **`PUT /orders/:id`**: Updates an existing order's parameters (like changing its status to *Delivered*).
* **`DELETE /orders/:id`**: Deletes a specific order.

#### Dashboard Configuration
* **`GET /dashboard`**: Loads saved widget items and screen grid coordinates.
* **`POST /dashboard`**: Saves or updates widget coordinates and setup values.

#### 🤖 AI Intelligence & Search
* **`GET /ai-insights`**: Automatically runs analytics to generate three simple rules-based cards:
  1. *Sales Performance* (tracks total cumulative revenue).
  2. *Top Market* (highlights the country with the highest transaction volume).
  3. *Efficiency* (calculates average transaction order size).
* **`POST /orders/query`**: The Natural Language Search core. It parses queries from the chat panel and filters the database down to specific order arrays:
  * *"Pending" / "Processing" / "Delivered"*: Filters records by fulfillment stage.
  * *"High value" / "Above 500"*: Isolates premium sales above $500.
  * *"Low value" / "Below 100"*: Isolates cheap purchases under $100.
  * *"Bulk" / "Large quantity"*: Displays wholesale counts (quantity of 5 or more).
  * *"Last 7 days"*: Isolates events from the past calendar week.
  * *"Clear" / "Reset"*: Restores the full unfiltered database array.

---

## 🎨 The Frontend System (`frontend/`)

The frontend is a fast, interactive single-page application built with **React, TypeScript, Tailwind CSS, and Recharts**.

### 🧭 Page Navigation (`frontend/src/App.tsx`)
The app uses a header bar to navigate between the main pages:
* **`/login` & `/register`**: Account access forms.
* **`/orders` (`OrdersPage.tsx`)**: An interactive data manager. You can see a list of all sales, add new orders, edit order details, or delete rows.
* **`/dashboard` (`DashboardViewPage.tsx`)**: The main viewing screen that shows all charts (widgets), live KPI figures, dynamic visual maps, and hosts the **AI Intelligence Sidebar**.
* **`/configure` (`DashboardConfigPage.tsx`)**: The edit/layout screen. Here you can add new charts (Bar, Area, Pie, Line, Table, KPI), resize elements, or drag widgets around on a grid.
* **`/shared/:id`**: A read-only shareable layout link you can send to other people to present real-time dashboards.

---

## 🦾 Core Components & Features Explained

### 1. 🏗️ Dynamic Drag-and-Drop Canvas (`GridCanvas.tsx`)
It uses `react-grid-layout` to map widgets onto a grid.
* **Resizing & Repositioning**: The canvas translates grid slots into responsive CSS heights/widths.
* **Interactive Drill-Downs**: Clicking a slice or row inside a chart opens a **Drill-Down Modal** that shows the raw orders backing that metric.

### 2. ⚡ Live Real-time Broadcasts (Socket.io)
The system uses web sockets (`socket.io-client`). When anyone adds, edits, or deletes an order on the *Orders* tab, the backend instantly broadcasts this event to everyone else. The dashboard charts automatically recalculate in real-time without requiring a page refresh!

### 3. 🤖 Premium AI Intelligence Sidebar Panel (`DashboardViewPage.tsx`)
The sidebar features a clean tabbed design:
* **💡 Insights Tab**: Shows rule-based cards. It includes **Interactive CTA Buttons**:
  * *Show All Sales*: Resets filters.
  * *Filter to [Country]*: Instantly changes the dashboard global country selection.
  * *Filter Price > $[Average]*: Sets a minimum price floor filter to see higher-tier orders.
* **💬 Assistant Tab**: A true AI chatbot interface:
  * Includes beautiful message bubbles and typing indicators.
  * Provides clickable **Quick Suggestion Chips** (*Show pending orders*, *High value orders*, *Bulk orders*, *Last 7 days*) to filter data in one click.
  * Displays **Mini KPI Summaries** (Volume, Total Revenue, Average Value) computed dynamically and formatted directly inside the chat response!
* **📊 Metrics Tab**: A live executive metric scorecard:
  * *Monthly Revenue Progress*: Shows total earnings relative to a $15,000 target.
  * *Live Distribution Bar*: A single segmented, multi-colored bar (Pending in Amber, Processing in Indigo, Delivered in Emerald) tracking order fulfillment ratios in real-time.

### 4. 🖨️ High-End Export Pipeline (`exportUtils.ts`)
* **PDF Exporter**: Uses `jspdf` and `html2canvas` to scan the grid canvas elements, format them into a clean landscape sheet, and generate a downloadable A4 report.
* **PNG Screenshot**: Captures individual chart widgets or the entire dashboard grid layout and downloads them as a high-quality picture.

---

## ⚡ Summary of How Data Flows
When a user interacts with the application, data moves in a simple loop:
1. You make a change (e.g. typing *"Show USA orders"* in the AI Chat or clicking a *Filter* CTA).
2. The frontend sends an API request to the backend.
3. The backend updates the SQLite database or retrieves a filtered list of orders.
4. The database replies, and the backend forwards the JSON array back to the frontend.
5. The frontend's React states (`orders`, `filters`) trigger updates.
6. The user interface re-renders instantly, animating the charts and KPI scores to match the new criteria!
