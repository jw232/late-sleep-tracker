import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecordList } from '@/components/history/record-list';
import type { SleepRecord } from '@/types';

vi.mock('@/components/history/record-card', () => ({
  RecordCard: ({ record, onEdit, onDelete }: any) => (
    <div data-testid={`record-${record.id}`}>
      <span>{record.reason_text}</span>
      <button onClick={() => onEdit(record.id, {})}>edit</button>
      <button onClick={() => onDelete(record.id)}>delete</button>
    </div>
  ),
}));

const mockT = {
  noRecords: '暂无记录',
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

const makeRecord = (id: string, reason: string): SleepRecord => ({
  id,
  record_date: '2026-02-09',
  sleep_time: '01:30:00',
  reason_text: reason,
  mood_score: 3,
  analysis: null,
  created_at: '2026-02-09T01:30:00Z',
  updated_at: '2026-02-09T01:30:00Z',
});

describe('RecordList', () => {
  it('shows noRecords message when records are empty', () => {
    render(
      <RecordList records={[]} t={mockT} analysisT={mockAnalysisT} onEdit={vi.fn()} onDelete={vi.fn()} />
    );
    expect(screen.getByText('暂无记录')).toBeInTheDocument();
  });

  it('renders a RecordCard for each record', () => {
    const records = [makeRecord('1', '加班'), makeRecord('2', '刷手机')];
    render(
      <RecordList records={records} t={mockT} analysisT={mockAnalysisT} onEdit={vi.fn()} onDelete={vi.fn()} />
    );
    expect(screen.getByTestId('record-1')).toBeInTheDocument();
    expect(screen.getByTestId('record-2')).toBeInTheDocument();
    expect(screen.getByText('加班')).toBeInTheDocument();
    expect(screen.getByText('刷手机')).toBeInTheDocument();
  });

  it('passes onEdit callback correctly', () => {
    const onEdit = vi.fn();
    const records = [makeRecord('abc', '加班')];
    render(
      <RecordList records={records} t={mockT} analysisT={mockAnalysisT} onEdit={onEdit} onDelete={vi.fn()} />
    );
    fireEvent.click(screen.getByText('edit'));
    expect(onEdit).toHaveBeenCalledWith('abc', {});
  });

  it('passes onDelete callback correctly', () => {
    const onDelete = vi.fn();
    const records = [makeRecord('xyz', '刷手机')];
    render(
      <RecordList records={records} t={mockT} analysisT={mockAnalysisT} onEdit={vi.fn()} onDelete={onDelete} />
    );
    fireEvent.click(screen.getByText('delete'));
    expect(onDelete).toHaveBeenCalledWith('xyz');
  });

  it('renders multiple records in order', () => {
    const records = [makeRecord('1', '第一条'), makeRecord('2', '第二条'), makeRecord('3', '第三条')];
    render(
      <RecordList records={records} t={mockT} analysisT={mockAnalysisT} onEdit={vi.fn()} onDelete={vi.fn()} />
    );
    const items = screen.getAllByTestId(/^record-/);
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveAttribute('data-testid', 'record-1');
    expect(items[1]).toHaveAttribute('data-testid', 'record-2');
    expect(items[2]).toHaveAttribute('data-testid', 'record-3');
  });
});
