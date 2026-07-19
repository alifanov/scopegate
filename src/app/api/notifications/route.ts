import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withUserAuth } from "@/lib/auth-middleware";

// GET /api/notifications — list notifications for current user
export const GET = withUserAuth(async (request, user) => {
  const { searchParams } = new URL(request.url);
  const countOnly = searchParams.get("countOnly") === "true";

  if (countOnly) {
    const unreadCount = await db.notification.count({
      where: { userId: user.userId, isRead: false },
    });
    return NextResponse.json({ unreadCount });
  }

  const notifications = await db.notification.findMany({
    where: { userId: user.userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const unreadCount = await db.notification.count({
    where: { userId: user.userId, isRead: false },
  });

  return NextResponse.json({ notifications, unreadCount });
});

// PATCH /api/notifications — mark notifications as read
export const PATCH = withUserAuth(async (request, user) => {
  try {
    const { ids } = await request.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "ids array is required" },
        { status: 400 }
      );
    }

    await db.notification.updateMany({
      where: { id: { in: ids }, userId: user.userId },
      data: { isRead: true },
    });

    const unreadCount = await db.notification.count({
      where: { userId: user.userId, isRead: false },
    });

    return NextResponse.json({ success: true, unreadCount });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
