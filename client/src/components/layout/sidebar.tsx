import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { 
  ChartLine, 
  Gauge, 
  FileText, 
  Users, 
  User, 
  Search,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const { user } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  const isActive = (path: string) => {
    if (path === '/') return location === '/';
    return location.startsWith(path);
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) return firstName[0].toUpperCase();
    if (user.email) return user.email[0].toUpperCase();
    return 'U';
  };

  const getDisplayName = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) return user.firstName;
    return user.email || 'User';
  };

  const getRoleDisplay = () => {
    switch (user.role) {
      case 'manager': return 'QA Manager';
      case 'reviewer': return 'QA Reviewer';
      default: return 'QA Engineer';
    }
  };

  return (
    <div className="w-64 bg-card shadow-lg">
      <div className="p-6 border-b border-border">
        <div className="flex items-center">
          <div className="bg-primary/10 rounded-lg w-10 h-10 flex items-center justify-center">
            <ChartLine className="text-primary" size={20} />
          </div>
          <div className="ml-3">
            <h1 className="font-semibold text-foreground">QA Coverage</h1>
            <p className="text-xs text-muted-foreground">Tracker</p>
          </div>
        </div>
      </div>
      
      <nav className="mt-6">
        {/* Manager Navigation */}
        {user.role === 'manager' && (
          <>
            <div className="px-6 pb-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Management
              </h3>
            </div>
            <Link 
              href="/"
              className={cn(
                "flex items-center px-6 py-3 text-foreground hover:bg-accent transition-colors",
                isActive('/') && "bg-accent"
              )}
              data-testid="link-team-dashboard"
            >
              <Gauge className="w-5 h-5" />
              <span className="ml-3">Team Dashboard</span>
            </Link>
            <Link 
              href="/dashboard/reports"
              className={cn(
                "flex items-center px-6 py-3 text-foreground hover:bg-accent transition-colors",
                isActive('/dashboard/reports') && "bg-accent"
              )}
              data-testid="link-reports"
            >
              <FileText className="w-5 h-5" />
              <span className="ml-3">Reports</span>
            </Link>
            <Link 
              href="/dashboard/users"
              className={cn(
                "flex items-center px-6 py-3 text-foreground hover:bg-accent transition-colors",
                isActive('/dashboard/users') && "bg-accent"
              )}
              data-testid="link-user-management"
            >
              <Users className="w-5 h-5" />
              <span className="ml-3">User Management</span>
            </Link>
          </>
        )}
        
        {/* Common Navigation */}
        <div className="px-6 pb-2 mt-6">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Personal
          </h3>
        </div>
        <Link 
          href="/dashboard/personal"
          className={cn(
            "flex items-center px-6 py-3 text-foreground hover:bg-accent transition-colors",
            isActive('/dashboard/personal') && "bg-accent"
          )}
          data-testid="link-personal-dashboard"
        >
          <User className="w-5 h-5" />
          <span className="ml-3">My Dashboard</span>
        </Link>
        
        {/* Reviewer Navigation */}
        {(user.role === 'reviewer' || user.role === 'manager') && (
          <Link 
            href="/dashboard/reviews"
            className={cn(
              "flex items-center px-6 py-3 text-foreground hover:bg-accent transition-colors",
              isActive('/dashboard/reviews') && "bg-accent"
            )}
            data-testid="link-reviews"
          >
            <Search className="w-5 h-5" />
            <span className="ml-3">My Reviews</span>
          </Link>
        )}
      </nav>
      
      {/* User Info */}
      <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-border">
        <div className="flex items-center">
          <div className="bg-primary/10 rounded-full w-10 h-10 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">
              {getInitials(user.firstName, user.lastName)}
            </span>
          </div>
          <div className="ml-3 flex-1">
            <p className="font-medium text-foreground text-sm" data-testid="text-user-name">
              {getDisplayName()}
            </p>
            <p className="text-sm text-muted-foreground" data-testid="text-user-role">
              {getRoleDisplay()}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.href = '/api/logout'}
            className="text-muted-foreground hover:text-foreground p-2"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
