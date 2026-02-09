'use client';

import { RecordCard } from './record-card';
import type { SleepRecord } from '@/types';

interface RecordListProps {
  records: SleepRecord[];
  t: {
    noRecords: string;
    edit: string;
    delete: string;
    confirmDelete: string;
    cancel: string;
    save: string;
    editRecord: string;
  };
  analysisT: {
    mainReasons: string;
    suggestions: string;
    tags: string;
  };
  onEdit: (id: string, data: { record_date: string; sleep_time: string; reason_text: string }) => void;
  onDelete: (id: string) => void;
}

export function RecordList({ records, t, analysisT, onEdit, onDelete }: RecordListProps) {
  if (records.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">{t.noRecords}</p>
    );
  }

  return (
    <div className="space-y-3">
      {records.map((record) => (
        <RecordCard
          key={record.id}
          record={record}
          t={t}
          analysisT={analysisT}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
