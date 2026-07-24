"use client";

import { Bell, Moon, Sun, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { APP_NOTIFICATIONS } from "@/lib/app-content";
import { useState } from "react";

export function Header() {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = APP_NOTIFICATIONS.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/80 backdrop-blur-md px-4 lg:px-8">
      <div className="lg:hidden flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
          <span className="text-white text-xs font-bold">FC</span>
        </div>
        <span className="font-semibold text-sm">Fiscal Copilot AI</span>
      </div>

      <div className="hidden lg:block">
        <p className="text-sm text-muted-foreground">
          Bienvenido, <span className="font-medium text-foreground">{user?.fullName ?? "Usuario"}</span>
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Cambiar tema"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notificaciones"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] text-white">
                {unreadCount}
              </span>
            )}
          </Button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 rounded-xl border bg-card shadow-lg animate-fade-in z-50">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-sm">Notificaciones</h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {APP_NOTIFICATIONS.map((notif) => (
                  <div key={notif.id} className="p-3 border-b last:border-0 hover:bg-accent/50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{notif.title}</p>
                      {!notif.read && <Badge variant="default" className="text-[10px]">Nuevo</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{notif.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <Link href="/perfil">
          <Avatar className="h-8 w-8 cursor-pointer">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {user?.fullName?.split(" ").map((n) => n[0]).join("").slice(0, 2) ?? "U"}
            </AvatarFallback>
          </Avatar>
        </Link>

        <Button variant="ghost" size="icon" onClick={logout} aria-label="Cerrar sesión">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
