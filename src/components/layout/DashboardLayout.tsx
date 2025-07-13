import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Notification } from "../Notification";
import { HelpButton } from "../HelpButton";
import { PlanModalGlobal } from "../PlanModalGlobal";
import { createClient } from "@supabase/supabase-js";
import { API_CONFIG } from "../../config/api.config";
import { supabase } from "../../lib/supabaseClient";



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
      <HelpButton />
      <Notification />
      <PlanModalGlobal />
    </div>
  );
}
