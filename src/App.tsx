import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/auth-context";
import { AppRoutes } from "./router";
import "./App.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/query-client";

function App() {
  return (
    <QueryClientProvider client={queryClient}><BrowserRouter>
      <AuthProvider>
        <div className="w-full overflow-hidden">
          <AppRoutes />
        </div>
      </AuthProvider>
    </BrowserRouter></QueryClientProvider>
  );
}

export default App;
