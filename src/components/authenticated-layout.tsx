import { Outlet } from "react-router-dom";
import Header from "./header";
import Sidebar from "./sidebar";

export function AuthenticatedLayout() {
  return <div className="flex min-h-dvh flex-col bg-background text-foreground">
    <a href="#main-content" className="sr-only z-50 rounded-md bg-primary p-3 text-primary-foreground focus:not-sr-only focus:fixed focus:left-3 focus:top-3">Ir para o conteúdo</a>
    <Header />
    <div className="flex flex-1">
      <Sidebar />
      <main id="main-content" className="min-w-0 flex-1 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-8"><Outlet /></main>
    </div>
  </div>;
}
