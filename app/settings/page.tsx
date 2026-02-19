'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useLocale } from '@/hooks/use-locale';
import { Download, Trash2, Shield, Info, LogOut } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { locale, setLocale, t } = useLocale();
  const [confirmText, setConfirmText] = useState('');
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    fetch('/api/records?days=3650')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setTotalRecords(data.length);
      })
      .catch(() => {});
  }, []);

  const handleExport = async (format: 'csv' | 'json') => {
    const res = await fetch(`/api/export?format=${format}`);
    if (format === 'csv') {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sleep-records.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sleep-records.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleClear = async () => {
    if (confirmText !== t.settings.clearConfirmText) return;
    await fetch('/api/export', { method: 'DELETE' });
    setTotalRecords(0);
    setConfirmText('');
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t.settings.title}</h1>

      {/* Language */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t.settings.language}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={locale === 'zh' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLocale('zh')}
            >
              中文
            </Button>
            <Button
              variant={locale === 'en' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLocale('en')}
            >
              English
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Download className="h-5 w-5" />
            {t.settings.export}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleExport('csv')}>
              {t.settings.exportCSV}
            </Button>
            <Button variant="outline" onClick={() => handleExport('json')}>
              {t.settings.exportJSON}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Clear data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            {t.settings.clearData}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{t.settings.clearConfirm}</p>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={t.settings.clearConfirmText}
            disabled={totalRecords === 0}
          />
          <Button
            variant="destructive"
            onClick={handleClear}
            disabled={confirmText !== t.settings.clearConfirmText || totalRecords === 0}
          >
            {totalRecords === 0 ? t.settings.noRecordsToClear : t.settings.clearButton}
          </Button>
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t.settings.privacy}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {t.settings.privacyPoints.map((point, i) => (
              <li key={i} className="text-sm text-muted-foreground flex gap-2">
                <span>•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="h-5 w-5" />
            {t.settings.about}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">
            <span className="font-medium">{t.settings.version}: </span>0.1.0
          </p>
          <p className="text-sm text-muted-foreground">{t.settings.description}</p>
          <p className="text-sm">
            <span className="font-medium">{t.settings.totalRecords}: </span>{totalRecords}
          </p>
        </CardContent>
      </Card>

      {/* Sign Out */}
      <Button
        variant="outline"
        className="w-full"
        onClick={async () => {
          await supabase.auth.signOut();
          router.push('/login');
        }}
      >
        <LogOut className="h-4 w-4 mr-2" />
        {t.settings.signOut}
      </Button>
    </div>
    </div>
  );
}
