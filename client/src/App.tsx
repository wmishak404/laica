import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";

import MobileApp from "@/pages/app";
import Cooking from "@/pages/cooking-new";
import GroceryList from "@/pages/grocery-list";

function Router() {
  return (
    <Switch>
      <Route path="/" component={MobileApp} />
      <Route path="/website" component={Home} />
      <Route path="/cooking" component={Cooking} />
      <Route path="/grocery-list" component={GroceryList} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
