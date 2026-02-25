"use client";

import React from "react";
import { Home, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";

interface SessionCompleteProps {
  correctCount: number;
  incorrectCount: number;
  totalCards: number;
  accuracy: string | number;
}

export const SessionComplete: React.FC<SessionCompleteProps> = ({
  correctCount,
  incorrectCount,
  totalCards,
  accuracy,
}) => {
  const router = useRouter();

  return (
    <Card className="mt-8 w-full max-w-4xl shadow-xl border-2">
      <CardHeader className="text-center space-y-4 pb-10">
        <div>
          <Badge variant="secondary" className="px-6 py-2 text-sm font-bold tracking-widest uppercase mb-4">
            Session Complete
          </Badge>
        </div>
        <CardTitle className="text-5xl font-black tracking-tight">
          Excellent Work!
        </CardTitle>
      </CardHeader>

      <CardContent className="grid w-full grid-cols-1 gap-6 md:grid-cols-3 pb-12">
        <div className="rounded-2xl border bg-card p-8 text-center shadow-sm transition-all hover:shadow-md">
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Mastered</p>
          <p className="mt-4 text-5xl font-black text-primary">{correctCount}</p>
        </div>
        
        <div className="rounded-2xl border bg-card p-8 text-center shadow-sm transition-all hover:shadow-md">
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Still Learning</p>
          <p className="mt-4 text-5xl font-black text-amber-500 dark:text-amber-400">{incorrectCount}</p>
        </div>
        
        <div className="rounded-2xl border bg-card p-8 text-center shadow-sm transition-all hover:shadow-md">
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Accuracy</p>
          <p className="mt-4 text-5xl font-black text-foreground">{accuracy}%</p>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col sm:flex-row gap-6 justify-center pb-12">
        <Button
          variant="outline"
          size="lg"
          onClick={() => window.location.reload()}
          className="w-full sm:w-auto px-10 h-14 text-lg gap-2 rounded-xl"
        >
          <RotateCcw className="h-5 w-5" />
          Study Again
        </Button>
        
        <Button
          size="lg"
          onClick={() => router.push("/")}
          className="w-full sm:w-auto px-10 h-14 text-lg gap-2 rounded-xl shadow-lg hover:shadow-primary/20"
        >
          <Home className="h-5 w-5" />
          Back to Dashboard
        </Button>
      </CardFooter>
    </Card>
  );
};
