import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecordForm } from '@/components/record/record-form';

const mockT = {
  date: '日期',
  sleepTime: '入睡时间',
  reason: '晚睡原因',
  reasonPlaceholder: '今天为什么晚睡了？',
  moodScore: '状态评分',
  submit: '提交记录',
  analyzing: 'AI 分析中...',
};

describe('RecordForm', () => {
  it('renders 16 time buttons (21:00-04:30)', () => {
    render(<RecordForm t={mockT} onSubmit={vi.fn()} isLoading={false} />);
    const timeButtons = screen.getAllByRole('button').filter((btn) => {
      const text = btn.textContent || '';
      return /^\d{2}:\d{2}$/.test(text);
    });
    expect(timeButtons).toHaveLength(16);
  });

  it('renders a date input', () => {
    const { container } = render(<RecordForm t={mockT} onSubmit={vi.fn()} isLoading={false} />);
    const dateInput = container.querySelector('input[type="date"]');
    expect(dateInput).toBeInTheDocument();
  });

  it('renders a reason textarea', () => {
    render(<RecordForm t={mockT} onSubmit={vi.fn()} isLoading={false} />);
    expect(screen.getByPlaceholderText('今天为什么晚睡了？')).toBeInTheDocument();
  });

  it('renders 5 mood score buttons', () => {
    render(<RecordForm t={mockT} onSubmit={vi.fn()} isLoading={false} />);
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByRole('button', { name: String(i) })).toBeInTheDocument();
    }
  });

  it('has submit button disabled initially (no time or reason)', () => {
    render(<RecordForm t={mockT} onSubmit={vi.fn()} isLoading={false} />);
    const submitBtn = screen.getByRole('button', { name: '提交记录' });
    expect(submitBtn).toBeDisabled();
  });
});
