
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import RainbowKitProvider from "@/components/RainbowKitProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import Landing from "./pages/Landing";
import Chat from "./pages/Chat";
import Functions from "./pages/Functions";
import NotFound from "./pages/NotFound";
import Web3Intro from "./pages/Web3Intro"; // Import the new page

// This query client is for non-wagmi related queries
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <RainbowKitProvider>
          <div className="min-h-screen flex flex-col relative overflow-hidden">
            <div className="decorative-background">
              <div className="decorative-lines"></div>
              <div className="decorative-gradient"></div>
              <div className="decorative-grid"></div>
            </div>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/functions" element={<Functions />} />
                <Route path="/web3-intro" element={<Web3Intro />} /> {/* Add the new route */}
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </div>
        </RainbowKitProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
