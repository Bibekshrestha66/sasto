import React, { useState, useRef, useEffect } from "react";
import { Bell, X, Check, AlertCircle, Info, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface Notification {
  id: string;
  type: "message" | "bid" | "sale" | "alert" | "info";
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
}

export default function NotificationCenter({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "message":
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case "bid":
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case "sale":
        return <Check className="h-4 w-4 text-green-500" />;
      case "alert":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "info":
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "message":
        return "bg-blue-50 border-blue-200";
      case "bid":
        return "bg-orange-50 border-orange-200";
      case "sale":
        return "bg-green-50 border-green-200";
      case "alert":
        return "bg-red-50 border-red-200";
      case "info":
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition"
      >
        <Bell className="w-[18px] h-[18px]" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-[18px] h-[18px] flex items-center justify-center p-0 rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </button>

      {/* Notification Dropdown — fullscreen overlay on mobile, popover on desktop */}
      {isOpen && (
        <>
          {/* Mobile: full-screen backdrop + centered panel */}
          <div className="sm:hidden fixed inset-0 z-50 flex flex-col bg-black/40" onClick={() => setIsOpen(false)}>
            <div
              className="mt-auto bg-white w-full rounded-t-2xl shadow-2xl max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 shrink-0">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={onMarkAllAsRead} className="text-xs">
                      Mark all as read
                    </Button>
                  )}
                  <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {/* List */}
              <div className="overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      icon={getNotificationIcon(notification.type)}
                      onMarkAsRead={onMarkAsRead}
                      onDelete={onDelete}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Desktop: anchored dropdown */}
          <div className="hidden sm:block absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={onMarkAllAsRead} className="text-xs">
                    Mark all as read
                  </Button>
                )}
                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            {/* List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    icon={getNotificationIcon(notification.type)}
                    onMarkAsRead={onMarkAsRead}
                    onDelete={onDelete}
                  />
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Shared notification row ──
function NotificationItem({
  notification,
  icon,
  onMarkAsRead,
  onDelete,
}: {
  notification: Notification;
  icon: React.ReactNode;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition ${
        !notification.read ? "bg-blue-50" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-1">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-gray-900 text-sm">{notification.title}</p>
              <p className="text-gray-600 text-xs mt-1">{notification.description}</p>
            </div>
            {!notification.read && (
              <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
            )}
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">{formatTime(notification.timestamp)}</span>
            <div className="flex gap-2">
              {!notification.read && (
                <button
                  onClick={() => onMarkAsRead(notification.id)}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Mark as read
                </button>
              )}
              <button
                onClick={() => onDelete(notification.id)}
                className="text-xs text-red-600 hover:text-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Date(date).toLocaleDateString();
}
