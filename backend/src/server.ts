import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import { z } from 'zod';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';

dotenv.config();

const port = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this';

// CORS: comma-separated origins from env (Docker sets http://localhost:5173)
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : true;

const prisma = new PrismaClient();
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json());

// Health check for Docker and load balancers
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'halleyx-backend', timestamp: new Date().toISOString() });
});

// Socket.io Connection
io.on('connection', (socket: Socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Auth Middleware
const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      (req as any).user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

// Validation Schemas
const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

const orderSchema = z.object({
  firstName: z.string().min(1, "Please fill the field"),
  lastName: z.string().min(1, "Please fill the field"),
  email: z.string().min(1, "Please fill the field").email("Invalid email"),
  phone: z.string().min(1, "Please fill the field"),
  street: z.string().min(1, "Please fill the field"),
  city: z.string().min(1, "Please fill the field"),
  state: z.string().min(1, "Please fill the field"),
  postalCode: z.string().min(1, "Please fill the field"),
  country: z.string().min(1, "Please fill the field"),
  product: z.string().min(1, "Please fill the field"),
  quantity: z.number().int().positive("Please fill the field"),
  unitPrice: z.number().positive("Please fill the field"),
  status: z.string().min(1, "Please fill the field"),
  createdBy: z.string().min(1, "Please fill the field"),
});

// --- AUTH ENDPOINTS ---

app.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = registerSchema.parse(req.body);
    
    const existing = await (prisma as any).user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await (prisma as any).user.create({
      data: { name, email, password: hashedPassword }
    });

    res.status(201).json({ message: "User registered successfully", userId: user.id });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ errors: error.issues });
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await (prisma as any).user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ errors: error.issues });
    res.status(500).json({ error: "Login failed" });
  }
});

// --- PROTECTED DATA ENDPOINTS ---

app.get('/orders', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

app.post('/orders', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const validatedData = orderSchema.parse(req.body);
    const totalAmount = validatedData.quantity * validatedData.unitPrice;

    const order = await prisma.order.create({
      data: { ...validatedData, totalAmount },
    });
    
    io.emit('order_created', order);
    res.status(201).json(order);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ errors: error.issues });
    res.status(500).json({ error: "Failed to create order" });
  }
});

app.put('/orders/:id', authenticateJWT, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const validatedData = orderSchema.parse(req.body);
    const totalAmount = validatedData.quantity * validatedData.unitPrice;

    const order = await prisma.order.update({
      where: { id: parseInt(id as string) },
      data: { ...validatedData, totalAmount },
    });

    io.emit('order_updated', order);
    res.json(order);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ errors: error.issues });
    res.status(500).json({ error: "Failed to update order" });
  }
});

app.delete('/orders/:id', authenticateJWT, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.order.delete({ where: { id: parseInt(id as string) } });
    io.emit('order_deleted', { id: parseInt(id as string) });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete order" });
  }
});

// --- DASHBOARD ENDPOINTS ---

app.get('/dashboard', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const dashboard = await prisma.dashboard.findFirst({ where: { name: 'default' } });
    if (!dashboard) {
      const newDash = await prisma.dashboard.create({ data: { name: 'default', layout: '[]', widgets: '[]' } });
      return res.json({ id: newDash.id, layout: [], widgets: [] });
    }
    res.json({
      id: dashboard.id,
      layout: JSON.parse(dashboard.layout),
      widgets: JSON.parse(dashboard.widgets),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

app.post('/dashboard', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { layout, widgets } = req.body;
    const dashboard = await prisma.dashboard.upsert({
      where: { id: 1 },
      update: {
        layout: JSON.stringify(layout ?? []),
        widgets: JSON.stringify(widgets ?? []),
      },
      create: {
        name: 'default',
        layout: JSON.stringify(layout ?? []),
        widgets: JSON.stringify(widgets ?? []),
      },
    });

    const updatedDash = {
      id: dashboard.id,
      layout: JSON.parse(dashboard.layout),
      widgets: JSON.parse(dashboard.widgets),
    };

    io.emit('dashboard_updated', updatedDash);
    res.json(updatedDash);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save dashboard' });
  }
});

// --- AI & INSIGHTS ENDPOINTS ---

app.get('/ai-insights', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany();
    
    // Simple rule-based insights
    const totalSales = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const avgOrder = orders.length > 0 ? totalSales / orders.length : 0;
    
    const countryCounts: Record<string, number> = {};
    orders.forEach(o => countryCounts[o.country] = (countryCounts[o.country] || 0) + 1);
    
    const topCountry = Object.entries(countryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    const insights = [
      { type: 'trend', title: 'Sales Performance', description: `Total revenue across ${orders.length} orders is $${totalSales.toFixed(2)}.` },
      { type: 'anomaly', title: 'Top Market', description: `${topCountry} is currently your highest performing region.` },
      { type: 'performance', title: 'Efficiency', description: `Average order value is maintains at $${avgOrder.toFixed(2)}.` }
    ];

    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

app.post('/orders/query', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    const orders = await prisma.order.findMany();
    
    let filteredOrders = [...orders];
    const q = query.toLowerCase();

    if (q.includes('clear') || q.includes('reset') || q.includes('all orders') || q.includes('show all')) {
      filteredOrders = [...orders];
    } else if (q.includes('top 5 countries') || q.includes('top countries')) {
      const countrySales: Record<string, number> = {};
      orders.forEach(o => countrySales[o.country] = (countrySales[o.country] || 0) + o.totalAmount);
      const topCountries = Object.entries(countrySales)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(e => e[0]);
      filteredOrders = orders.filter(o => topCountries.includes(o.country));
    } else if (q.includes('usa') || q.includes('america')) {
      filteredOrders = orders.filter(o => o.country === 'USA');
    } else if (q.includes('last 7 days')) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      filteredOrders = orders.filter(o => new Date(o.createdAt) >= sevenDaysAgo);
    } else if (q.includes('pending')) {
      filteredOrders = orders.filter(o => o.status.toLowerCase() === 'pending');
    } else if (q.includes('processing')) {
      filteredOrders = orders.filter(o => o.status.toLowerCase() === 'processing');
    } else if (q.includes('delivered')) {
      filteredOrders = orders.filter(o => o.status.toLowerCase() === 'delivered');
    } else if (q.includes('high value') || q.includes('high-value') || q.includes('above 500') || q.includes('expensive')) {
      filteredOrders = orders.filter(o => o.totalAmount >= 500);
    } else if (q.includes('low value') || q.includes('low-value') || q.includes('below 100') || q.includes('cheap')) {
      filteredOrders = orders.filter(o => o.totalAmount < 100);
    } else if (q.includes('bulk') || q.includes('large quantity') || q.includes('quantity >= 5') || q.includes('quantity greater than')) {
      filteredOrders = orders.filter(o => o.quantity >= 5);
    }

    res.json(filteredOrders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to process query' });
  }
});

httpServer.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${port}`);
});
