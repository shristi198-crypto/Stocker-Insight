import { useState, useEffect } from "react";
import { Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CORRECT_PIN = "0809";
const STORAGE_KEY = "stockerss_unlocked";

interface PinLockProps {
  children: React.ReactNode;
  featureName: string;
}

export function PinLock({ children, featureName }: PinLockProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    const unlocked = sessionStorage.getItem(STORAGE_KEY);
    if (unlocked === "true") {
      setIsUnlocked(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === CORRECT_PIN) {
      setIsUnlocked(true);
      sessionStorage.setItem(STORAGE_KEY, "true");
      setError(false);
    } else {
      setError(true);
      setPin("");
    }
  };

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-primary/50">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-primary via-amber-400 to-yellow-300">
            Feature Locked
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            Enter 4-digit PIN to access <span className="text-primary font-semibold">{featureName}</span>
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, ""));
                  setError(false);
                }}
                placeholder="Enter PIN"
                className={`text-center text-2xl tracking-[0.5em] font-mono bg-secondary border-primary/30 focus:border-primary ${error ? "border-destructive" : ""}`}
                data-testid="input-pin"
                autoFocus
              />
              {error && (
                <p className="text-destructive text-sm text-center">Incorrect PIN. Try again.</p>
              )}
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={pin.length !== 4}
              data-testid="button-unlock"
            >
              <Unlock className="w-4 h-4 mr-2" />
              Unlock {featureName}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
