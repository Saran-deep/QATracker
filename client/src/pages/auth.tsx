import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartLine } from "lucide-react";
import { loginSchema, registerSchema } from "@shared/schema";
import type { LoginData, RegisterData } from "@shared/schema";

export default function AuthPage() {
  const { toast } = useToast();
  const { loginMutation, registerMutation, isAuthenticated } = useAuth();
  
  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'engineer',
    },
  });

  // Redirect if already authenticated
  if (isAuthenticated) {
    window.location.href = '/';
    return null;
  }

  const onLogin = (data: LoginData) => {
    loginMutation.mutate(data, {
      onError: (error) => {
        toast({
          title: "Login Failed",
          description: error.message || "Invalid credentials",
          variant: "destructive",
        });
      },
    });
  };

  const onRegister = (data: RegisterData) => {
    registerMutation.mutate(data, {
      onError: (error) => {
        toast({
          title: "Registration Failed", 
          description: error.message || "Registration failed",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Column - Auth Forms */}
      <div className="flex-1 flex items-center justify-center bg-background p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <ChartLine className="text-2xl text-primary" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-foreground">QA Test Coverage Tracker</h1>
            <p className="text-muted-foreground mt-2">Sign in to manage your test coverage</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" data-testid="tab-login">Sign In</TabsTrigger>
              <TabsTrigger value="register" data-testid="tab-register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Sign In</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your username" 
                                {...field} 
                                data-testid="input-login-username"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password"
                                placeholder="Enter your password" 
                                {...field} 
                                data-testid="input-login-password"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={loginMutation.isPending}
                        data-testid="button-login"
                      >
                        {loginMutation.isPending ? 'Signing In...' : 'Sign In'}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create Account</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Choose a username" 
                                {...field} 
                                data-testid="input-register-username"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                type="email"
                                placeholder="Enter your email" 
                                {...field} 
                                data-testid="input-register-email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="First name" 
                                  {...field} 
                                  data-testid="input-register-firstname"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Last name" 
                                  {...field} 
                                  data-testid="input-register-lastname"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={registerForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-register-role">
                                  <SelectValue placeholder="Select your role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="engineer">QA Engineer</SelectItem>
                                <SelectItem value="reviewer">QA Reviewer</SelectItem>
                                <SelectItem value="manager">QA Manager</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password"
                                placeholder="Choose a password (min 6 characters)" 
                                {...field} 
                                data-testid="input-register-password"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={registerMutation.isPending}
                        data-testid="button-register"
                      >
                        {registerMutation.isPending ? 'Creating Account...' : 'Create Account'}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Right Column - Hero Section */}
      <div className="flex-1 bg-gradient-to-br from-primary/10 to-accent flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Track & Monitor Test Coverage
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Achieve and maintain ≥90% test coverage with our comprehensive tracking system. 
            Support peer reviews, team analytics, and performance evaluations.
          </p>
          <div className="grid grid-cols-1 gap-4 text-left">
            <div className="flex items-center">
              <div className="bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center mr-3">
                <span className="text-primary font-bold">✓</span>
              </div>
              <span className="text-foreground">Role-based dashboards</span>
            </div>
            <div className="flex items-center">
              <div className="bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center mr-3">
                <span className="text-primary font-bold">✓</span>
              </div>
              <span className="text-foreground">Peer review workflows</span>
            </div>
            <div className="flex items-center">
              <div className="bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center mr-3">
                <span className="text-primary font-bold">✓</span>
              </div>
              <span className="text-foreground">Team performance analytics</span>
            </div>
            <div className="flex items-center">
              <div className="bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center mr-3">
                <span className="text-primary font-bold">✓</span>
              </div>
              <span className="text-foreground">Exportable reports</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}