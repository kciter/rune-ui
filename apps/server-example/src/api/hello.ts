import type { Request, Response } from "express";

export function GET(req: Request, res: Response) {
  res.json({
    message: "Hello from Rune UI API!",
    timestamp: new Date().toISOString(),
    method: "GET",
  });
}

export function POST(req: Request, res: Response) {
  const { name } = req.body || {};

  res.json({
    message: `Hello, ${name || "World"}!`,
    timestamp: new Date().toISOString(),
    method: "POST",
    body: req.body,
  });
}
