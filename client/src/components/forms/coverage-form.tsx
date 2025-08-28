import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

const coverageFormSchema = z.object({
  score: z.number().min(0, "Score must be at least 0").max(100, "Score must be at most 100"),
  comments: z.string().optional(),
});

type CoverageFormValues = z.infer<typeof coverageFormSchema>;

interface CoverageFormProps {
  storyId: string;
  storyTitle: string;
  currentScore?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CoverageForm({ 
  storyId, 
  storyTitle, 
  currentScore, 
  onSuccess, 
  onCancel 
}: CoverageFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CoverageFormValues>({
    resolver: zodResolver(coverageFormSchema),
    defaultValues: {
      score: currentScore || 0,
      comments: '',
    },
  });

  const updateCoverageMutation = useMutation({
    mutationFn: async (data: CoverageFormValues) => {
      const response = await apiRequest('PATCH', `/api/stories/${storyId}/coverage`, {
        score: data.score,
        comments: data.comments,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stories/my-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/team'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/personal'] });
      toast({
        title: "Success",
        description: "Coverage updated successfully",
      });
      onSuccess?.();
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

  const onSubmit = (data: CoverageFormValues) => {
    updateCoverageMutation.mutate(data);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Update Coverage Score</CardTitle>
        <p className="text-sm text-muted-foreground">{storyTitle}</p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="score"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coverage Score (%)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Enter score (0-100)" 
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      data-testid="input-coverage-score"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comments (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add review comments..." 
                      rows={3}
                      {...field} 
                      data-testid="textarea-coverage-comments"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2 pt-4">
              {onCancel && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onCancel}
                  data-testid="button-cancel-coverage"
                >
                  Cancel
                </Button>
              )}
              <Button 
                type="submit" 
                disabled={updateCoverageMutation.isPending}
                data-testid="button-update-coverage"
              >
                {updateCoverageMutation.isPending ? 'Updating...' : 'Update Coverage'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
