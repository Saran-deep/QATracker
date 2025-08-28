import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ListTodo, Percent, Trophy } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { UserWithStats, StoryWithDetails } from "@/types";

export default function PersonalDashboard() {
  const { toast } = useToast();

  // Fetch personal statistics
  const { data: personalStats, isLoading: statsLoading } = useQuery<UserWithStats>({
    queryKey: ['/api/analytics/personal'],
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

  // Fetch personal stories
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

  const getStatusBadge = (score?: string) => {
    if (!score) return <Badge variant="secondary">Pending</Badge>;
    const numScore = parseFloat(score);
    return numScore >= 90 ? 
      <Badge className="bg-green-100 text-green-800">Pass</Badge> :
      <Badge className="bg-red-100 text-red-800">Fail</Badge>;
  };

  if (statsLoading || storiesLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-3 gap-6 mb-8">
          {[...Array(3)].map((_, i) => (
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
      {/* Personal Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-lg p-3">
                <ListTodo className="text-blue-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-muted-foreground">My Stories</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-my-stories">
                  {personalStats?.totalStories || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-green-100 rounded-lg p-3">
                <Percent className="text-green-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-muted-foreground">Avg Coverage</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-avg-coverage">
                  {personalStats?.averageCoverage?.toFixed(1) || '0.0'}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-purple-100 rounded-lg p-3">
                <Trophy className="text-purple-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-muted-foreground">Status</p>
                <p className={`text-lg font-bold ${personalStats?.status === 'pass' ? 'text-green-600' : 'text-red-600'}`} data-testid="text-status">
                  {personalStats?.status === 'pass' ? 'Passing' : 'Below Target'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Coverage Trend Chart Placeholder */}
      <Card className="mb-8">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Coverage Trend</h3>
        </div>
        <CardContent className="pt-6">
          <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Trophy className="mx-auto mb-2 text-muted-foreground" size={48} />
              <p className="text-muted-foreground">Coverage trend chart would be displayed here</p>
              <p className="text-sm text-muted-foreground mt-1">Chart implementation coming soon</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Personal Stories Table */}
      <Card>
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">My Stories</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Ticket ID</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Title</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Reviewer</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Coverage %</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stories?.map((story) => (
                <tr key={story.id} className="hover:bg-accent" data-testid={`row-personal-story-${story.id}`}>
                  <td className="px-6 py-4 font-mono text-sm text-primary" data-testid={`text-personal-ticket-${story.id}`}>
                    {story.ticketId}
                  </td>
                  <td className="px-6 py-4 text-foreground" data-testid={`text-personal-title-${story.id}`}>
                    {story.title}
                  </td>
                  <td className="px-6 py-4 text-foreground" data-testid={`text-personal-reviewer-${story.id}`}>
                    {story.reviewer ? (
                      story.reviewer.firstName ? 
                        `${story.reviewer.firstName} ${story.reviewer.lastName || ''}` :
                        story.reviewer.email
                    ) : (
                      <span className="text-muted-foreground">Not assigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-foreground font-medium" data-testid={`text-personal-coverage-${story.id}`}>
                    {story.coverageScore ? `${parseFloat(story.coverageScore).toFixed(0)}%` : '-'}
                  </td>
                  <td className="px-6 py-4" data-testid={`text-personal-status-${story.id}`}>
                    {getStatusBadge(story.coverageScore)}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground" data-testid={`text-personal-date-${story.id}`}>
                    {story.dateCompleted ? 
                      new Date(story.dateCompleted).toLocaleDateString() :
                      new Date(story.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {(!stories || stories.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No stories found. Your created stories will appear here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
