import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ClipboardCheck, CheckCircle, Download } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { StoryWithDetails } from "@/types";
import { useState, useMemo } from "react";
import Filters, { type FilterState } from "@/components/common/filters";
import { exportToCSV, formatStoriesForExport } from "@/utils/export";

interface ReviewData {
  score: string;
  comments: string;
}

export default function ReviewerDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [reviewData, setReviewData] = useState<{[key: string]: ReviewData}>({});
  const [filters, setFilters] = useState<FilterState>({});

  // Fetch stories for review
  const { data: reviewStories, isLoading: reviewsLoading } = useQuery<StoryWithDetails[]>({
    queryKey: ['/api/stories/my-reviews'],
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

  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: async ({ storyId, score, comments }: { storyId: string; score: number; comments?: string }) => {
      const response = await apiRequest('PATCH', `/api/stories/${storyId}/coverage`, { score, comments });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stories/my-reviews'] });
      setReviewData({});
      toast({
        title: "Success",
        description: "Review submitted successfully",
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
        description: "Failed to submit review",
        variant: "destructive",
      });
    },
  });

  const handleSubmitReview = (storyId: string) => {
    const data = reviewData[storyId];
    if (!data || !data.score) {
      toast({
        title: "Error",
        description: "Please enter a coverage score",
        variant: "destructive",
      });
      return;
    }

    const score = parseFloat(data.score);
    if (isNaN(score) || score < 0 || score > 100) {
      toast({
        title: "Error",
        description: "Please enter a valid score between 0 and 100",
        variant: "destructive",
      });
      return;
    }

    submitReviewMutation.mutate({
      storyId,
      score,
      comments: data.comments || undefined
    });
  };

  const updateReviewData = (storyId: string, field: keyof ReviewData, value: string) => {
    setReviewData(prev => ({
      ...prev,
      [storyId]: {
        ...prev[storyId],
        [field]: value
      }
    }));
  };

  // Apply filters to stories
  const filteredStories = useMemo(() => {
    if (!reviewStories) return [];
    
    return reviewStories.filter(story => {
      // Date filter
      if (filters.dateFrom && new Date(story.createdAt) < filters.dateFrom) return false;
      if (filters.dateTo && new Date(story.createdAt) > filters.dateTo) return false;
      
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
  }, [reviewStories, filters]);

  const pendingStories = filteredStories?.filter(story => !story.coverageScore) || [];
  const completedStories = filteredStories?.filter(story => story.coverageScore) || [];

  const handleExportReviews = () => {
    if (completedStories.length === 0) {
      toast({
        title: "No Data",
        description: "No completed reviews to export with current filters",
        variant: "destructive",
      });
      return;
    }
    
    const exportData = formatStoriesForExport(completedStories);
    const timestamp = new Date().toISOString().split('T')[0];
    exportToCSV(exportData, `my-reviews-${timestamp}.csv`);
    
    toast({
      title: "Success",
      description: `Exported ${completedStories.length} reviews to CSV`,
    });
  };

  if (reviewsLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-2 gap-6 mb-8">
          {[...Array(2)].map((_, i) => (
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
        showUserFilter={false}
      />
      
      {/* Review Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-orange-100 rounded-lg p-3">
                <ClipboardCheck className="text-orange-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-muted-foreground">Pending Reviews</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-pending-reviews">
                  {pendingStories.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-green-100 rounded-lg p-3">
                <CheckCircle className="text-green-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-muted-foreground">Completed Reviews</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-completed-reviews">
                  {completedStories.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Pending Reviews */}
      <Card className="mb-8">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Pending Reviews</h3>
        </div>
        
        <div className="divide-y divide-border">
          {pendingStories.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No pending reviews at this time.
            </div>
          ) : (
            pendingStories.map((story) => (
              <div key={story.id} className="p-6" data-testid={`review-card-${story.id}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium text-foreground" data-testid={`text-review-title-${story.id}`}>
                      {story.ticketId} - {story.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Created by{' '}
                      <span data-testid={`text-review-creator-${story.id}`}>
                        {story.creator.firstName ? 
                          `${story.creator.firstName} ${story.creator.lastName || ''}` :
                          story.creator.email}
                      </span>
                      {' • '}
                      <span data-testid={`text-review-date-${story.id}`}>
                        {new Date(story.createdAt).toLocaleDateString()}
                      </span>
                    </p>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    Pending
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Coverage Score (%)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Enter score (0-100)"
                      value={reviewData[story.id]?.score || ''}
                      onChange={(e) => updateReviewData(story.id, 'score', e.target.value)}
                      data-testid={`input-review-score-${story.id}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Comments (Optional)
                    </label>
                    <Textarea
                      rows={2}
                      placeholder="Add review comments..."
                      value={reviewData[story.id]?.comments || ''}
                      onChange={(e) => updateReviewData(story.id, 'comments', e.target.value)}
                      data-testid={`textarea-review-comments-${story.id}`}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end mt-4">
                  <Button
                    onClick={() => handleSubmitReview(story.id)}
                    disabled={submitReviewMutation.isPending}
                    data-testid={`button-submit-review-${story.id}`}
                  >
                    Submit Review
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
      
      {/* Completed Reviews */}
      <Card>
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Recent Completed Reviews</h3>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={handleExportReviews}
              data-testid="button-export-reviews-csv"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Ticket ID</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Title</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Creator</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Score Given</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Date Reviewed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {completedStories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No completed reviews yet.
                  </td>
                </tr>
              ) : (
                completedStories.map((story) => (
                  <tr key={story.id} className="hover:bg-accent" data-testid={`row-completed-review-${story.id}`}>
                    <td className="px-6 py-4 font-mono text-sm text-primary" data-testid={`text-completed-ticket-${story.id}`}>
                      {story.ticketId}
                    </td>
                    <td className="px-6 py-4 text-foreground" data-testid={`text-completed-title-${story.id}`}>
                      {story.title}
                    </td>
                    <td className="px-6 py-4 text-foreground" data-testid={`text-completed-creator-${story.id}`}>
                      {story.creator.firstName ? 
                        `${story.creator.firstName} ${story.creator.lastName || ''}` :
                        story.creator.email}
                    </td>
                    <td className="px-6 py-4 text-foreground font-medium" data-testid={`text-completed-score-${story.id}`}>
                      {story.coverageScore ? `${parseFloat(story.coverageScore).toFixed(0)}%` : '-'}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground" data-testid={`text-completed-date-${story.id}`}>
                      {story.dateCompleted ? 
                        new Date(story.dateCompleted).toLocaleDateString() :
                        '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
