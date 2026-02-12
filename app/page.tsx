import { createClient } from '@/lib/supabase/server';
import RecordPage from '@/components/record/record-page';
import LandingPage from '@/components/landing/landing-page';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) return <RecordPage />;
  return <LandingPage />;
}
