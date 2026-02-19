'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RecordList } from '@/components/history/record-list';
import { useLocale } from '@/hooks/use-locale';
import { Search } from 'lucide-react';
import type { SleepRecord } from '@/types';

export default function HistoryPage() {
  const { t } = useLocale();
  const [records, setRecords] = useState<SleepRecord[]>([]);
  const [days, setDays] = useState(7);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(false);

  const fetchRecords = useCallback(async (searchTerm?: string) => {
    try {
      setError(false);
      const params = new URLSearchParams({ days: days.toString() });
      if (searchTerm) params.set('search', searchTerm);
      const res = await fetch(`/api/records?${params}`);
      const data = await res.json();
      if (Array.isArray(data)) setRecords(data);
    } catch {
      setError(true);
    }
  }, [days]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleSearch = () => {
    fetchRecords(search);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleEdit = async (id: string, data: { record_date: string; sleep_time: string; reason_text: string }) => {
    try {
      setError(false);
      await fetch('/api/records', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      });
      fetchRecords(search);
    } catch {
      setError(true);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setError(false);
      await fetch(`/api/records?id=${id}`, { method: 'DELETE' });
      fetchRecords(search);
    } catch {
      setError(true);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t.history.title}</h1>

      {/* Filter tabs */}
      <div className="flex gap-2">
        <Button
          variant={days === 7 ? 'default' : 'outline'}
          size="sm"
          onClick={() => setDays(7)}
        >
          {t.history.last7Days}
        </Button>
        <Button
          variant={days === 30 ? 'default' : 'outline'}
          size="sm"
          onClick={() => setDays(30)}
        >
          {t.history.last30Days}
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <Input
          placeholder={t.history.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button variant="outline" size="icon" onClick={handleSearch}>
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {error && (
        <p className="text-sm text-red-400 font-medium">{t.history.error}</p>
      )}

      {/* Record list */}
      <RecordList
        records={records}
        t={t.history}
        analysisT={t.analysis}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
    </div>
  );
}
