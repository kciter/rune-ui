import type { Request, Response } from "express";

export function GET(req: Request, res: Response) {
  const { id } = req.params;

  // 실제 앱에서는 데이터베이스에서 가져올 데이터
  const user = {
    id,
    name: `User ${id}`,
    email: `user${id}@example.com`,
    status: "active",
    lastSeen: new Date().toISOString(),
  };

  res.json({
    success: true,
    user,
  });
}

export function PUT(req: Request, res: Response) {
  const { id } = req.params;
  const { name, email } = req.body || {};

  // 실제 앱에서는 데이터베이스 업데이트
  res.json({
    success: true,
    message: `User ${id} updated successfully`,
    user: {
      id,
      name: name || `User ${id}`,
      email: email || `user${id}@example.com`,
      updatedAt: new Date().toISOString(),
    },
  });
}

export function DELETE(req: Request, res: Response) {
  const { id } = req.params;

  res.json({
    success: true,
    message: `User ${id} deleted successfully`,
  });
}
