import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Database } from "lucide-react";

export const NavigationMenu = () => {
  const location = useLocation();

  return (
    <nav className="flex gap-2">
      <Link to="/">
        <Button
          variant={location.pathname === "/" ? "default" : "ghost"}
          className="gap-2"
        >
          <Shield className="h-4 w-4" />
          Detections
        </Button>
      </Link>
      <Link to="/criminals">
        <Button
          variant={location.pathname === "/criminals" ? "default" : "ghost"}
          className="gap-2"
        >
          <Database className="h-4 w-4" />
          Criminal Database
        </Button>
      </Link>
    </nav>
  );
};
