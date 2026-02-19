'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useLocale } from '@/hooks/use-locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Moon } from 'lucide-react';

export default function LoginPage() {
  const { t } = useLocale();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setMessage({ type: 'error', text: t.login.error });
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) {
      setMessage({ type: 'error', text: t.login.error });
    } else {
      setMessage({ type: 'success', text: t.login.checkEmail });
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Moon className="mx-auto h-10 w-10 text-primary mb-2" />
          <CardTitle className="text-2xl">{t.login.title}</CardTitle>
          <p className="text-sm text-muted-foreground">{t.login.subtitle}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            className="w-full"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            {t.login.google}
          </Button>

          <div className="flex items-center gap-3">
            <span className="flex-1 border-t border-border" />
            <span className="text-xs uppercase text-muted-foreground">{t.login.or}</span>
            <span className="flex-1 border-t border-border" />
          </div>

          <form onSubmit={handleMagicLink} className="space-y-3">
            <Input
              type="email"
              placeholder={t.login.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <Button
              type="submit"
              variant="outline"
              className="w-full"
              disabled={loading || !email.trim()}
            >
              {t.login.sendLink}
            </Button>
          </form>

          {message && (
            <p
              className={`text-sm text-center ${
                message.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-destructive'
              }`}
            >
              {message.text}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
