import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecordCard } from '@/components/history/record-card';
import type { SleepRecord } from '@/types';

const mockT = {
  edit: '编辑',
  delete: '删除',
  confirmDelete: '确认删除？',
  cancel: '取消',
  save: '保存',
  editRecord: '编辑记录',
};

const mockAnalysisT = {
  mainReasons: '主要原因',
  suggestions: '改善建议',
  tags: '标签',
};

const baseRecord: SleepRecord = {
  id: '1',
  record_date: '2026-02-09',
  sleep_time: '01:30:00',
  reason_text: '加班写代码',
  mood_score: 3,
  analysis: null,
  created_at: '2026-02-09T01:30:00Z',
  updated_at: '2026-02-09T01:30:00Z',
};

describe('RecordCard', () => {
  it('renders date and time', () => {
    render(
      <RecordCard record={baseRecord} t={mockT} analysisT={mockAnalysisT} onEdit={vi.fn()} onDelete={vi.fn()} />
    );
    expect(screen.getByText('2026-02-09')).toBeInTheDocument();
    expect(screen.getByText('01:30')).toBeInTheDocument();
  });

  it('renders reason text', () => {
    render(
      <RecordCard record={baseRecord} t={mockT} analysisT={mockAnalysisT} onEdit={vi.fn()} onDelete={vi.fn()} />
    );
    expect(screen.getByText('加班写代码')).toBeInTheDocument();
  });

  it('renders confidence and suggestions when analysis exists', () => {
    const recordWithAnalysis: SleepRecord = {
      ...baseRecord,
      analysis: {
        top_reasons: [{ reason: '工作', confidence: 85 }],
        suggestions: ['早点下班'],
        tags: ['work'],
      },
    };
    render(
      <RecordCard record={recordWithAnalysis} t={mockT} analysisT={mockAnalysisT} onEdit={vi.fn()} onDelete={vi.fn()} />
    );
    expect(screen.getByText('工作')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('早点下班')).toBeInTheDocument();
  });

  it('does not crash when analysis is null', () => {
    const { container } = render(
      <RecordCard record={baseRecord} t={mockT} analysisT={mockAnalysisT} onEdit={vi.fn()} onDelete={vi.fn()} />
    );
    expect(container).toBeTruthy();
  });

  it('renders tags', () => {
    const recordWithTags: SleepRecord = {
      ...baseRecord,
      analysis: {
        top_reasons: [],
        suggestions: [],
        tags: ['work', 'deadline'],
      },
    };
    render(
      <RecordCard record={recordWithTags} t={mockT} analysisT={mockAnalysisT} onEdit={vi.fn()} onDelete={vi.fn()} />
    );
    expect(screen.getByText('work')).toBeInTheDocument();
    expect(screen.getByText('deadline')).toBeInTheDocument();
  });
});
