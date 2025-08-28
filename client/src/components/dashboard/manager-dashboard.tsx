import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ListTodo, 
  TrendingUp, 
  AlertTriangle, 
  Clock,
  Edit,
  Eye,
  Plus,
  Download
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { TeamStats, UserWithStats, StoryWithDetails } from "@/types";
import { useState, useMemo } from "react";
import CreateStoryForm from "@/components/forms/create-story-form";
import Filters, { type FilterState } from "@/components/common/filters";
import { exportToCSV, formatStoriesForExport, formatUsersForExport } from "@/utils/export";

export default function ManagerDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingCoverage, setEditingCoverage] = useState<{[key: string]: string}>({});
  const [filters, setFilters] = useState<FilterState>({});

  // Fetch team statistics
  const { data: teamStats, isLoading: statsLoading } = useQuery<TeamStats>({
    queryKey: ['/api/analytics/team'],
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
    },
  });

  // Fetch all users with stats
  const { data: users, isLoading: usersLoading } = useQuery<UserWithStats[]>({
    queryKey: ['/api/analytics/users'],
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
    },
  });

  // Fetch all users for filter dropdown
  const { data: allUsers } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Fetch all stories
  const { data: stories, isLoading: storiesLoading } = useQuery<StoryWithDetails[]>({
    queryKey: ['/api/stories'],
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
    },
  });

  // Assign reviewer mutation
  const assignReviewerMutation = useMutation({
    mutationFn: async ({ storyId, reviewerId }: { storyId: string; reviewerId: string }) => {
      const response = await apiRequest('PATCH', `/api/stories/${storyId}/reviewer`, { reviewerId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
      toast({
        title: "Success",
        description: "Reviewer assigned successfully",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to assign reviewer",
        variant: "destructive",
      });
    },
  });

  // Update coverage mutation
  const updateCoverageMutation = useMutation({
    mutationFn: async ({ storyId, score }: { storyId: string; score: number }) => {
      const response = await apiRequest('PATCH', `/api/stories/${storyId}/coverage`, { score });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/team'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/users'] });
      setEditingCoverage({});
      toast({
        title: "Success",
        description: "Coverage updated successfully",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update coverage",
        variant: "destructive",
      });
    },
  });

  const handleUpdateCoverage = (storyId: string) => {
    const score = parseFloat(editingCoverage[storyId]);
    if (isNaN(score) || score < 0 || score > 100) {
      toast({
        title: "Error",
        description: "Please enter a valid score between 0 and 100",
        variant: "destructive",
      });
      return;
    }
    updateCoverageMutation.mutate({ storyId, score });
  };

  const getStatusBadge = (score?: string) => {
    if (!score) return <Badge variant="secondary">Pending</Badge>;
    const numScore = parseFloat(score);
    return numScore >= 90 ? 
      <Badge className="bg-green-100 text-green-800">Pass</Badge> :
      <Badge className="bg-red-100 text-red-800">Fail</Badge>;
  };

  // Apply filters to stories
  const filteredStories = useMemo(() => {
    if (!stories) return [];
    
    return stories.filter(story => {
      // Date filter
      if (filters.dateFrom && new Date(story.createdAt) < filters.dateFrom) return false;
      if (filters.dateTo && new Date(story.createdAt) > filters.dateTo) return false;
      
      // User filter
      if (filters.userId && story.creatorId !== filters.userId) return false;
      
      // Status filter
      if (filters.status) {
        const score = story.coverageScore ? parseFloat(story.coverageScore) : null;
        switch (filters.status) {
          case 'pass':
            return score !== null && score >= 90;
          case 'fail':
            return score !== null && score < 90;
          case 'pending':
            return score === null;
        }
      }
      
      return true;
    });
  }, [stories, filters]);

  // Apply filters to users
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    
    return users.filter(user => {
      // User filter
      if (filters.userId && user.id !== filters.userId) return false;
      
      // Status filter
      if (filters.status) {
        switch (filters.status) {
          case 'pass':
            return user.status === 'pass';
          case 'fail':
            return user.status === 'fail';
          case 'pending':
            return false; // Users don't have pending status
        }
      }
      
      return true;
    });
  }, [users, filters]);

  const handleExportStories = () => {
    if (filteredStories.length === 0) {
      toast({
        title: "No Data",
        description: "No stories to export with current filters",
        variant: "destructive",
      });
      return;
    }
    
    const exportData = formatStoriesForExport(filteredStories);
    const timestamp = new Date().toISOString().split('T')[0];
    exportToCSV(exportData, `stories-report-${timestamp}.csv`);
    
    toast({
      title: "Success",
      description: `Exported ${filteredStories.length} stories to CSV`,
    });
  };

  const handleExportUsers = () => {
    if (filteredUsers.length === 0) {
      toast({
        title: "No Data", 
        description: "No users to export with current filters",
        variant: "destructive",
      });
      return;
    }
    
    const exportData = formatUsersForExport(filteredUsers);
    const timestamp = new Date().toISOString().split('T')[0];
    exportToCSV(exportData, `users-report-${timestamp}.csv`);
    
    toast({
      title: "Success",
      description: `Exported ${filteredUsers.length} users to CSV`,
    });
  };

  if (statsLoading || usersLoading || storiesLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse">
                  <div className="h-12 bg-muted rounded mb-4"></div>
                  <div className="h-8 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Filters */}
      <Filters
        filters={filters}
        onFiltersChange={setFilters}
        users={allUsers}
        showUserFilter={true}
      />
      
      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-lg p-3">
                <ListTodo className="text-blue-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-muted-foreground">Total Stories</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-total-stories">
                  {teamStats?.totalStories || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-green-100 rounded-lg p-3">
                <TrendingUp className="text-green-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-muted-foreground">Team Avg Coverage</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-team-average">
                  {teamStats?.averageCoverage?.toFixed(1) || '0.0'}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 rounded-lg p-3">
                <AlertTriangle className="text-yellow-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-muted-foreground">Below 90%</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-users-below-90">
                  {teamStats?.usersBelow90 || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-purple-100 rounded-lg p-3">
                <Clock className="text-purple-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-muted-foreground">Pending Reviews</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-pending-reviews">
                  {teamStats?.pendingReviews || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Team Performance Table */}
      <Card className="mb-8">
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Team Performance</h3>
            <div className="flex space-x-2">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={handleExportUsers}
                data-testid="button-export-users-csv"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Users CSV
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={handleExportStories}
                data-testid="button-export-stories-csv"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Stories CSV
              </Button>
              <CreateStoryForm onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
                queryClient.invalidateQueries({ queryKey: ['/api/analytics/team'] });
              }} />
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">User</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground"># Stories</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Avg Coverage</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers?.map((user) => (
                <tr key={user.id} className="hover:bg-accent" data-testid={`row-user-${user.id}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {user.firstName?.[0] || user.email?.[0] || 'U'}
                          {user.lastName?.[0] || ''}
                        </span>
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-foreground" data-testid={`text-username-${user.id}`}>
                          {user.firstName && user.lastName ? 
                            `${user.firstName} ${user.lastName}` : 
                            user.email}
                        </p>
                        <p className="text-sm text-muted-foreground">QA Engineer</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-foreground" data-testid={`text-story-count-${user.id}`}>
                    {user.totalStories}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <span className="text-foreground font-medium" data-testid={`text-coverage-${user.id}`}>
                        {user.averageCoverage.toFixed(1)}%
                      </span>
                      <div className="ml-2 w-16 bg-muted rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${user.status === 'pass' ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(user.averageCoverage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.status === 'pass' ? (
                      <Badge className="bg-green-100 text-green-800">Pass</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800">Fail</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Button variant="ghost" size="sm" className="mr-3" data-testid={`button-edit-${user.id}`}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" data-testid={`button-view-${user.id}`}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      
      {/* Recent Stories */}
      <Card>
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Recent Stories</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Ticket ID</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Title</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Creator</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Reviewer</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Coverage %</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredStories?.slice(0, 10).map((story) => (
                <tr key={story.id} className="hover:bg-accent" data-testid={`row-story-${story.id}`}>
                  <td className="px-6 py-4 font-mono text-sm text-primary" data-testid={`text-ticket-${story.id}`}>
                    {story.ticketId}
                  </td>
                  <td className="px-6 py-4 text-foreground" data-testid={`text-title-${story.id}`}>
                    {story.title}
                  </td>
                  <td className="px-6 py-4 text-foreground" data-testid={`text-creator-${story.id}`}>
                    {story.creator.firstName ? 
                      `${story.creator.firstName} ${story.creator.lastName || ''}` :
                      story.creator.email}
                  </td>
                  <td className="px-6 py-4">
                    {story.reviewer ? (
                      <span className="text-foreground" data-testid={`text-reviewer-${story.id}`}>
                        {story.reviewer.firstName ? 
                          `${story.reviewer.firstName} ${story.reviewer.lastName || ''}` :
                          story.reviewer.email}
                      </span>
                    ) : (
                      <Select 
                        onValueChange={(value) => 
                          assignReviewerMutation.mutate({ storyId: story.id, reviewerId: value })
                        }
                      >
                        <SelectTrigger className="w-40" data-testid={`select-reviewer-${story.id}`}>
                          <SelectValue placeholder="Select Reviewer..." />
                        </SelectTrigger>
                        <SelectContent>
                          {allUsers?.filter(u => u.role === 'reviewer' || u.role === 'manager').map(user => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.firstName ? 
                                `${user.firstName} ${user.lastName || ''}` :
                                user.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {story.coverageScore ? (
                      editingCoverage[story.id] !== undefined ? (
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={editingCoverage[story.id]}
                            onChange={(e) => setEditingCoverage(prev => ({
                              ...prev,
                              [story.id]: e.target.value
                            }))}
                            className="w-16"
                            data-testid={`input-coverage-${story.id}`}
                          />
                          <span className="text-muted-foreground text-sm">%</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className="text-foreground font-medium" data-testid={`text-coverage-${story.id}`}>
                            {parseFloat(story.coverageScore).toFixed(0)}%
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingCoverage(prev => ({
                              ...prev,
                              [story.id]: story.coverageScore!
                            }))}
                            data-testid={`button-edit-coverage-${story.id}`}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        </div>
                      )
                    ) : (
                      editingCoverage[story.id] !== undefined ? (
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={editingCoverage[story.id]}
                            onChange={(e) => setEditingCoverage(prev => ({
                              ...prev,
                              [story.id]: e.target.value
                            }))}
                            className="w-16"
                            placeholder="0-100"
                            data-testid={`input-coverage-new-${story.id}`}
                          />
                          <span className="text-muted-foreground text-sm">%</span>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingCoverage(prev => ({
                            ...prev,
                            [story.id]: '0'
                          }))}
                          data-testid={`button-add-coverage-${story.id}`}
                        >
                          Add Score
                        </Button>
                      )
                    )}
                  </td>
                  <td className="px-6 py-4" data-testid={`text-status-${story.id}`}>
                    {getStatusBadge(story.coverageScore)}
                  </td>
                  <td className="px-6 py-4">
                    {editingCoverage[story.id] !== undefined ? (
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          onClick={() => handleUpdateCoverage(story.id)}
                          disabled={updateCoverageMutation.isPending}
                          data-testid={`button-save-coverage-${story.id}`}
                        >
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingCoverage(prev => {
                            const newState = { ...prev };
                            delete newState[story.id];
                            return newState;
                          })}
                          data-testid={`button-cancel-coverage-${story.id}`}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : story.reviewer ? (
                      <Button size="sm" variant="outline" data-testid={`button-view-story-${story.id}`}>
                        View
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="secondary"
                        disabled={assignReviewerMutation.isPending}
                        data-testid={`button-assign-reviewer-${story.id}`}
                      >
                        Assign
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
