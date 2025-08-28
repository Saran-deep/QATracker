import { useState } from "react";
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

const storyFormSchema = z.object({
  ticketId: z.string().min(1, "Ticket ID is required"),
  title: z.string().min(1, "Title is required"),
});

type StoryFormValues = z.infer<typeof storyFormSchema>;

interface StoryFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function StoryForm({ onSuccess, onCancel }: StoryFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<StoryFormValues>({
    resolver: zodResolver(storyFormSchema),
    defaultValues: {
      ticketId: '',
      title: '',
    },
  });

  const createStoryMutation = useMutation({
    mutationFn: async (data: StoryFormValues) => {
      const response = await apiRequest('POST', '/api/stories', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
      toast({
        title: "Success",
        description: "Story created successfully",
      });
      form.reset();
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
        description: "Failed to create story",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: StoryFormValues) => {
    createStoryMutation.mutate(data);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create New Story</CardTitle>
      </CardHeader>
      <CardContent>
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
                      data-testid="input-ticket-id"
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
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., User Authentication Flow" 
                      {...field} 
                      data-testid="input-story-title"
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
                  data-testid="button-cancel-story"
                >
                  Cancel
                </Button>
              )}
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
      </CardContent>
    </Card>
  );
}
