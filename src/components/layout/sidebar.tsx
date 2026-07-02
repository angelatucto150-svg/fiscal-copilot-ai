"use client";

import {
  LayoutDashboard,
  FileCheck,
  History,
  BarChart3,
  HelpCircle,
  Settings,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils";
import { NAV_ITEMS } from "@/lib/constants";

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  FileCheck,
  History,
  BarChart3,
  HelpCircle,
  Settings,
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r bg-card/50 backdrop-blur-sm">
      <div className="flex h-16 items-center gap-2 px-6 border-b">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
          <FileCheck className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-sm leading-tight">Fiscal Copilot</p>
          <p className="text-[10px] text-muted-foreground">AI</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.icon];
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all animate-slide-in",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {Icon && <Icon className="h-4 w-4" />}
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t bg-card/95 backdrop-blur-md">
      <div className="flex items-center justify-around py-2">
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const Icon = iconMap[item.icon];
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-1 text-[10px] font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              {Icon && <Icon className="h-5 w-5" />}
              <span className="truncate max-w-[60px]">{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
