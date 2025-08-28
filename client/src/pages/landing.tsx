import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartLine } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent">
      <div className="max-w-md w-full mx-4">
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center mb-8">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <ChartLine className="text-2xl text-primary" size={32} />
              </div>
              <h1 className="text-2xl font-bold text-foreground">QA Test Coverage Tracker</h1>
              <p className="text-muted-foreground mt-2">Sign in to access your dashboard</p>
            </div>
            
            <div className="space-y-4">
              <Button 
                onClick={() => window.location.href = '/api/login'}
                className="w-full"
                data-testid="button-login"
              >
                Sign In with Replit
              </Button>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Track test coverage, manage peer reviews, and monitor team performance
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
