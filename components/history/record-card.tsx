'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pencil, Trash2, Clock, Calendar } from 'lucide-react';
import type { SleepRecord } from '@/types';

interface RecordCardProps {
  record: SleepRecord;
  t: {
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

export function RecordCard({ record, t, analysisT, onEdit, onDelete }: RecordCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editDate, setEditDate] = useState(record.record_date);
  const [editTime, setEditTime] = useState(record.sleep_time);
  const [editReason, setEditReason] = useState(record.reason_text);

  const handleSave = () => {
    onEdit(record.id, {
      record_date: editDate,
      sleep_time: editTime,
      reason_text: editReason,
    });
    setEditOpen(false);
  };

  const handleDelete = () => {
    onDelete(record.id);
    setDeleteOpen(false);
  };

  return (
    <>
      <Card>
        <CardContent className="py-4 space-y-3">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {record.record_date}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {record.sleep_time?.slice(0, 5)}
              </span>
              {record.mood_score && (
                <span>Score: {record.mood_score}/5</span>
              )}
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditOpen(true)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Reason */}
          <p className="text-sm">{record.reason_text}</p>

          {/* AI Analysis */}
          {record.analysis && (
            <div className="border-t pt-3 space-y-3">
              {/* Top reasons with confidence bars */}
              {record.analysis.top_reasons?.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium mb-1.5">{analysisT.mainReasons}</h4>
                  <div className="space-y-1.5">
                    {record.analysis.top_reasons.map((item, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span>{item.reason}</span>
                          <span className="text-muted-foreground">{item.confidence}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${item.confidence}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {record.analysis.suggestions?.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium mb-1">{analysisT.suggestions}</h4>
                  <ul className="space-y-0.5">
                    {record.analysis.suggestions.map((s, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                        <span>•</span><span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tags */}
              {record.analysis.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {record.analysis.tags.map((tag, i) => (
                    <span key={i} className="rounded-full bg-muted px-2 py-0.5 text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.editRecord}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea value={editReason} onChange={(e) => setEditReason(e.target.value)} rows={3} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditOpen(false)}>{t.cancel}</Button>
              <Button onClick={handleSave}>{t.save}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.confirmDelete}</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>{t.cancel}</Button>
            <Button variant="destructive" onClick={handleDelete}>{t.delete}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
