import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/features/app-sidebar";
import { NavigatorChat } from "@/components/features/navigator-chat";
import { NotificationBell } from "@/components/features/notification-bell";
import { ThemeToggle } from "@/components/features/theme-toggle";
import { DataProvider } from "@/components/providers/data-provider";
import { ReminderScheduler } from "@/components/features/reminder-scheduler";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <TooltipProvider>
      <DataProvider>
        <ReminderScheduler />
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-14 shrink-0 items-center gap-2 px-4 sm:px-6">
              <SidebarTrigger className="-ml-1" />
              <div className="flex-1" />
              <ThemeToggle />
              <NotificationBell />
            </header>
            <main className="flex-1 px-4 sm:px-6 lg:px-10 pb-12 text-base">{children}</main>
          </SidebarInset>
          <NavigatorChat />
        </SidebarProvider>
      </DataProvider>
    </TooltipProvider>
  );
}
