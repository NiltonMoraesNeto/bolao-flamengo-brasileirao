import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/auth-context";
import { AppRoutes } from "./router";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="w-full overflow-hidden">
          <AppRoutes />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
