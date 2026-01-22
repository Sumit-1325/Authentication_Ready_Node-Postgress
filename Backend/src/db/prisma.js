// src/db/prisma.js
import pkg from "@prisma/client";
const { PrismaClient } = pkg; 
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// 1. Create a standard PostgreSQL connection pool
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// 2. Wrap it in the Prisma adapter
const adapter = new PrismaPg(pool);

// 3. Pass the adapter to the client
const prisma = new PrismaClient({ 
  adapter,
  log: ['query', 'info', 'warn', 'error'] 
});

export default prisma;