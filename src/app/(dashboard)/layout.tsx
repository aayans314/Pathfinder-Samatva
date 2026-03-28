import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "@/components/features/app-sidebar";
import { NavigatorChat } from "@/components/features/navigator-chat";
import { DataProvider } from "@/components/providers/data-provider";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <TooltipProvider>
      <DataProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 !h-4" />
              <span className="text-sm font-medium text-muted-foreground">
                Pathfinder
              </span>
            </header>
            <main className="flex-1 p-6">{children}</main>
          </SidebarInset>
          <NavigatorChat />
        </SidebarProvider>
      </DataProvider>
    </TooltipProvider>
  );
}
