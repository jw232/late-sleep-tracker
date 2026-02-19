'use client';

import { useState, useEffect, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSearchParams } from 'next/navigation';
import { useLocale } from '@/hooks/use-locale';
import { CreditCard } from 'lucide-react';
import type { SubscriptionStatus } from '@/types';

export default function BillingPage() {
  return (
    <Suspense>
      <BillingContent />
    </Suspense>
  );
}

function BillingContent() {
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const [sub, setSub] = useState<SubscriptionStatus | null>(null);
  const [paymentMsg, setPaymentMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/usage').then(r => r.json()).then(setSub).catch(() => {});

    const payment = searchParams.get('payment');
    if (payment === 'success') setPaymentMsg(t.billing.paymentSuccess);
    if (payment === 'canceled') setPaymentMsg(t.billing.paymentCanceled);
  }, [searchParams, t.billing.paymentSuccess, t.billing.paymentCanceled]);

  const handleCheckout = async (priceId: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });
      const { url, error } = await res.json();
      if (url) window.location.href = url;
      else setPaymentMsg(error || 'Checkout failed');
    } catch {
      setPaymentMsg('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handlePortal = async () => {
    const res = await fetch('/api/stripe/portal', { method: 'POST' });
    const { url } = await res.json();
    if (url) window.location.href = url;
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t.billing.subscription}</h1>

      {/* Payment message */}
      {paymentMsg && (
        <div className={`rounded-lg border p-3 text-sm ${
          searchParams.get('payment') === 'success'
            ? 'border-green-600/30 dark:border-green-400/30 bg-green-600/5 dark:bg-green-400/5 text-green-700 dark:text-green-300'
            : 'border-red-600/30 dark:border-red-400/30 bg-red-600/5 dark:bg-red-400/5 text-red-700 dark:text-red-300'
        }`}>
          {paymentMsg}
        </div>
      )}

      {/* Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t.billing.subscription}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sub?.isPro ? (
            <>
              <div className="flex items-center gap-2">
                <span className="rounded bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">PRO</span>
                <span className="text-sm text-muted-foreground">{t.billing.currentPlan}</span>
              </div>
              {sub.currentPeriodEnd && (
                <p className="text-sm text-muted-foreground">
                  {t.billing.expiresOn}: {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                </p>
              )}
              {sub.cancelAtPeriodEnd && (
                <p className="text-sm text-amber-400">{t.billing.cancelAtEnd}</p>
              )}
              <Button variant="outline" onClick={handlePortal}>
                {t.billing.manageSubscription}
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {t.billing.currentPlan}: {t.billing.freePlan}
              </p>
              <div className="flex gap-2">
                <Button disabled={loading} onClick={() => handleCheckout(process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY!)}>
                  {loading ? '...' : t.billing.monthly}
                </Button>
                <Button disabled={loading} variant="outline" onClick={() => handleCheckout(process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY!)}>
                  {t.billing.yearly}
                  <span className="ml-1 text-xs text-green-600 dark:text-green-400">({t.billing.yearlySave})</span>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
    </div>
  );
}
