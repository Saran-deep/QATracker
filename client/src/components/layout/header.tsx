import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Filter } from "lucide-react";

export default function Header() {
  const [location] = useLocation();
  const [dateFrom, setDateFrom] = useState('2024-01-01');
  const [dateTo, setDateTo] = useState('2024-03-31');

  const getPageInfo = () => {
    switch (location) {
      case '/':
        return {
          title: 'Team Dashboard',
          subtitle: 'Monitor test coverage across your team'
        };
      case '/dashboard/personal':
        return {
          title: 'My Dashboard',
          subtitle: 'View your test coverage performance'
        };
      case '/dashboard/reviews':
        return {
          title: 'My Reviews',
          subtitle: 'Review assigned test coverage tasks'
        };
      case '/dashboard/reports':
        return {
          title: 'Reports',
          subtitle: 'Generate and export coverage reports'
        };
      case '/dashboard/users':
        return {
          title: 'User Management',
          subtitle: 'Manage team members and roles'
        };
      default:
        return {
          title: 'Dashboard',
          subtitle: 'QA Test Coverage Tracker'
        };
    }
  };

  const { title, subtitle } = getPageInfo();

  return (
    <header className="bg-card shadow-sm border-b border-border">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground" data-testid="text-page-title">
            {title}
          </h2>
          <p className="text-muted-foreground" data-testid="text-page-subtitle">
            {subtitle}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-muted-foreground">Date Range:</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-auto"
              data-testid="input-date-from"
            />
            <span className="text-muted-foreground">to</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-auto"
              data-testid="input-date-to"
            />
          </div>
          <Button data-testid="button-filter">
            <Filter className="mr-2 w-4 h-4" />
            Filter
          </Button>
        </div>
      </div>
    </header>
  );
}
