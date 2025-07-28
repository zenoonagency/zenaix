import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Notification } from "../Notification";

export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-transparent">
      <div className="flex h-screen">
        <div className="flex-none h-full bg-transparent">
          <Sidebar />
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
      <Notification />
    </div>
  );
}
