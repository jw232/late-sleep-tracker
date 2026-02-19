import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecordForm } from '@/components/record/record-form';

vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

const mockT = {
  date: '日期',
  sleepTime: '入睡时间',
  reason: '晚睡原因',
  reasonPlaceholder: '今天为什么晚睡了？',
  moodScore: '状态评分',
  submit: '提交记录',
  analyzing: 'AI 分析中...',
};

describe('RecordForm interactions', () => {
  it('clicking a time button highlights it', { timeout: 15000 }, () => {
    render(<RecordForm t={mockT} onSubmit={vi.fn()} isLoading={false} />);
    const timeButton = screen.getByRole('button', { name: '23:00' });
    fireEvent.click(timeButton);
    // After clicking, the button should have variant='default' (data-variant attribute)
    expect(timeButton).toHaveAttribute('data-variant', 'default');
  });

  it('can type in reason textarea', () => {
    render(<RecordForm t={mockT} onSubmit={vi.fn()} isLoading={false} />);
    const textarea = screen.getByPlaceholderText('今天为什么晚睡了？');
    fireEvent.change(textarea, { target: { value: '加班写代码' } });
    expect(textarea).toHaveValue('加班写代码');
  });

  it('submit button is enabled after filling time and reason', () => {
    render(<RecordForm t={mockT} onSubmit={vi.fn()} isLoading={false} />);
    const timeButton = screen.getByRole('button', { name: '23:00' });
    fireEvent.click(timeButton);
    const textarea = screen.getByPlaceholderText('今天为什么晚睡了？');
    fireEvent.change(textarea, { target: { value: '加班' } });
    const submitBtn = screen.getByRole('button', { name: '提交记录' });
    expect(submitBtn).not.toBeDisabled();
  });

  it('submit calls onSubmit with correct RecordFormData', () => {
    const onSubmit = vi.fn();
    render(<RecordForm t={mockT} onSubmit={onSubmit} isLoading={false} />);
    // Select time
    fireEvent.click(screen.getByRole('button', { name: '01:00' }));
    // Type reason
    fireEvent.change(screen.getByPlaceholderText('今天为什么晚睡了？'), {
      target: { value: '刷手机' },
    });
    // Click submit
    fireEvent.click(screen.getByRole('button', { name: '提交记录' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    const callArg = onSubmit.mock.calls[0][0];
    expect(callArg.sleep_time).toBe('01:00');
    expect(callArg.reason_text).toBe('刷手机');
    expect(callArg.mood_score).toBe(3); // default
    expect(callArg.record_date).toBeDefined();
  });

  it('does not call onSubmit when sleepTime is empty', () => {
    const onSubmit = vi.fn();
    render(<RecordForm t={mockT} onSubmit={onSubmit} isLoading={false} />);
    fireEvent.change(screen.getByPlaceholderText('今天为什么晚睡了？'), {
      target: { value: '理由' },
    });
    // Submit button should be disabled, but also test handleSubmit guard
    const submitBtn = screen.getByRole('button', { name: '提交记录' });
    expect(submitBtn).toBeDisabled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not call onSubmit when reason is only spaces', () => {
    const onSubmit = vi.fn();
    render(<RecordForm t={mockT} onSubmit={onSubmit} isLoading={false} />);
    fireEvent.click(screen.getByRole('button', { name: '22:00' }));
    fireEvent.change(screen.getByPlaceholderText('今天为什么晚睡了？'), {
      target: { value: '   ' },
    });
    const submitBtn = screen.getByRole('button', { name: '提交记录' });
    expect(submitBtn).toBeDisabled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('trims reason text before submission', () => {
    const onSubmit = vi.fn();
    render(<RecordForm t={mockT} onSubmit={onSubmit} isLoading={false} />);
    fireEvent.click(screen.getByRole('button', { name: '23:30' }));
    fireEvent.change(screen.getByPlaceholderText('今天为什么晚睡了？'), {
      target: { value: '  加班  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: '提交记录' }));
    expect(onSubmit.mock.calls[0][0].reason_text).toBe('加班');
  });

  it('shows analyzing text when isLoading is true', () => {
    render(<RecordForm t={mockT} onSubmit={vi.fn()} isLoading={true} />);
    expect(screen.getByText('AI 分析中...')).toBeInTheDocument();
  });

  it('submit button is disabled when isLoading is true', () => {
    render(<RecordForm t={mockT} onSubmit={vi.fn()} isLoading={true} />);
    const submitBtn = screen.getByRole('button', { name: 'AI 分析中...' });
    expect(submitBtn).toBeDisabled();
  });

  it('default date is today', () => {
    const today = new Date().toISOString().split('T')[0];
    const { container } = render(<RecordForm t={mockT} onSubmit={vi.fn()} isLoading={false} />);
    const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement;
    expect(dateInput.value).toBe(today);
  });
});
