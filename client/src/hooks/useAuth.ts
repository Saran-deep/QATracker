import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User, LoginData, RegisterData } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        return null;
      }
      
      try {
        const response = await apiRequest('GET', '/api/auth/user');
        return await response.json();
      } catch (error) {
        // If 401, clear token and return null
        if (error instanceof Error && error.message.includes('401')) {
          localStorage.removeItem('authToken');
          return null;
        }
        throw error;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const response = await apiRequest('POST', '/api/auth/login', credentials);
      const data = await response.json();
      
      // Store token in localStorage
      localStorage.setItem('authToken', data.token);
      
      return data.user;
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/auth/user"], user);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const response = await apiRequest('POST', '/api/auth/register', userData);
      const data = await response.json();
      
      // Store token in localStorage
      localStorage.setItem('authToken', data.token);
      
      return data.user;
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/auth/user"], user);
    },
  });

  const logout = () => {
    localStorage.removeItem('authToken');
    queryClient.setQueryData(["/api/auth/user"], null);
    queryClient.clear();
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    loginMutation,
    registerMutation,
    logout,
  };
}
