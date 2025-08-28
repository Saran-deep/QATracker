import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarIcon, FilterX } from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DayPicker } from "react-day-picker";
import type { User } from "@shared/schema";

export interface FilterState {
  dateFrom?: Date;
  dateTo?: Date;
  userId?: string;
  status?: 'all' | 'pass' | 'fail' | 'pending';
}

interface FiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  users?: User[];
  showUserFilter?: boolean;
  className?: string;
}

export default function Filters({ 
  filters, 
  onFiltersChange, 
  users = [], 
  showUserFilter = true,
  className = ""
}: FiltersProps) {
  const [dateFromOpen, setDateFromOpen] = useState(false);
  const [dateToOpen, setDateToOpen] = useState(false);

  const handleClearFilters = () => {
    onFiltersChange({});
  };

  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value === 'all' ? undefined : value,
    });
  };

  return (
    <Card className={`mb-6 ${className}`}>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Date From */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">From Date</label>
            <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  data-testid="button-date-from"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateFrom ? format(filters.dateFrom, "MMM dd, yyyy") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <DayPicker
                  mode="single"
                  selected={filters.dateFrom}
                  onSelect={(date) => {
                    updateFilter('dateFrom', date);
                    setDateFromOpen(false);
                  }}
                  disabled={(date) => date > new Date()}
                  className="p-3"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Date To */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">To Date</label>
            <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  data-testid="button-date-to"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateTo ? format(filters.dateTo, "MMM dd, yyyy") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <DayPicker
                  mode="single"
                  selected={filters.dateTo}
                  onSelect={(date) => {
                    updateFilter('dateTo', date);
                    setDateToOpen(false);
                  }}
                  disabled={(date) => date > new Date() || (filters.dateFrom && date < filters.dateFrom)}
                  className="p-3"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* User Filter (Manager only) */}
          {showUserFilter && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">User</label>
              <Select value={filters.userId || 'all'} onValueChange={(value) => updateFilter('userId', value)}>
                <SelectTrigger data-testid="select-user-filter">
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName && user.lastName ? 
                        `${user.firstName} ${user.lastName}` : 
                        user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Status</label>
            <div className="flex space-x-2">
              <Select value={filters.status || 'all'} onValueChange={(value) => updateFilter('status', value)}>
                <SelectTrigger className="flex-1" data-testid="select-status-filter">
                  <SelectValue placeholder="All status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pass">Pass (≥90%)</SelectItem>
                  <SelectItem value="fail">Fail (&lt;90%)</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Clear Filters Button */}
              <Button
                variant="outline"
                size="icon"
                onClick={handleClearFilters}
                title="Clear all filters"
                data-testid="button-clear-filters"
              >
                <FilterX className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}