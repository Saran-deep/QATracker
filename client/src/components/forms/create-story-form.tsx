import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { insertStorySchema } from "@shared/schema";
import type { InsertStory, User } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

// Create a form schema without the auto-generated fields
const formSchema = insertStorySchema.pick({
  ticketId: true,
  title: true,
  reviewerId: true,
});

interface CreateStoryFormProps {
  onSuccess?: () => void;
}

export default function CreateStoryForm({ onSuccess }: CreateStoryFormProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch all users to select reviewers
  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  type FormData = {
    ticketId: string;
    title: string;
    reviewerId?: string;
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ticketId: '',
      title: '',
      reviewerId: undefined,
    },
  });

  const createStoryMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const storyData: InsertStory = {
        ...data,
        creatorId: user?.id || '',
        status: 'pending',
      };
      const response = await apiRequest('POST', '/api/stories', storyData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/team'] });
      setOpen(false);
      form.reset();
      onSuccess?.();
      toast({
        title: "Success",
        description: "Story created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create story",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createStoryMutation.mutate(data);
  };

  // Filter out current user and non-reviewers for reviewer selection
  const availableReviewers = users?.filter(u => 
    u.id !== user?.id && (u.role === 'reviewer' || u.role === 'manager')
  ) || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" data-testid="button-add-story">
          <Plus className="w-4 h-4 mr-2" />
          Add Story
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Story</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="ticketId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ticket ID</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., PROJ-1234" 
                      {...field} 
                      data-testid="input-story-ticket-id"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Story Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter story title" 
                      {...field} 
                      data-testid="input-story-title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="reviewerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign Reviewer (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-story-reviewer">
                        <SelectValue placeholder="Select a reviewer..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableReviewers.map(reviewer => (
                        <SelectItem key={reviewer.id} value={reviewer.id}>
                          {reviewer.firstName && reviewer.lastName ? 
                            `${reviewer.firstName} ${reviewer.lastName}` : 
                            reviewer.email} 
                          ({reviewer.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                data-testid="button-cancel-story"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createStoryMutation.isPending}
                data-testid="button-create-story"
              >
                {createStoryMutation.isPending ? 'Creating...' : 'Create Story'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}