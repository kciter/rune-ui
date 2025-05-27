import type { Request, Response } from "express";

export default function handler(req: Request, res: Response) {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();

  res.json({
    status: "healthy",
    uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
    memory: {
      used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
    },
    timestamp: new Date().toISOString(),
    node: process.version,
  });
}
