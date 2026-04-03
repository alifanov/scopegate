"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Skeleton } from "@/components/ui/skeleton";
import { BellOff, CheckCheck } from "lucide-react";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [marking, setMarking] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      } else {
        toast.error("Failed to load notifications");
      }
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    const unread = notifications.filter((n) => !n.isRead);
    if (selected.size === unread.length && unread.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(unread.map((n) => n.id)));
    }
  }

  async function handleMarkAsRead() {
    if (selected.size === 0) return;
    setMarking(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (selected.has(n.id) ? { ...n, isRead: true } : n))
        );
        setSelected(new Set());
        toast.success("Marked as read");
      } else {
        toast.error("Failed to mark as read");
      }
    } catch {
      toast.error("Failed to mark as read");
    } finally {
      setMarking(false);
    }
  }

  const unreadNotifications = notifications.filter((n) => !n.isRead);

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Notifications" }]} />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {unreadNotifications.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSelectAll}
            >
              {selected.size === unreadNotifications.length
                ? "Deselect all"
                : "Select all unread"}
            </Button>
            <Button
              size="sm"
              disabled={selected.size === 0 || marking}
              onClick={handleMarkAsRead}
            >
              <CheckCheck className="size-4" />
              {marking ? "Marking..." : "Mark as read"}
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <div className="rounded-full bg-primary/10 p-4 mb-4">
            <BellOff className="size-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">No notifications</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            You&apos;re all caught up. Notifications will appear here when
            errors or important events occur.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start gap-3 rounded-lg border p-4 transition-colors ${
                notification.isRead
                  ? "bg-muted/30"
                  : "bg-background border-primary/20"
              }`}
            >
              {!notification.isRead && (
                <Checkbox
                  checked={selected.has(notification.id)}
                  onCheckedChange={() => toggleSelect(notification.id)}
                  className="mt-0.5"
                />
              )}
              {notification.isRead && <div className="w-4" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">
                    {notification.title}
                  </span>
                  <Badge
                    variant={
                      notification.type === "error" ? "destructive" : "secondary"
                    }
                    className="text-[10px]"
                  >
                    {notification.type}
                  </Badge>
                  {!notification.isRead && (
                    <span className="size-2 rounded-full bg-primary shrink-0" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {notification.message}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
