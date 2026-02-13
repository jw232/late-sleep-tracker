import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReasonChart } from '@/components/insights/reason-chart';

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div data-testid="card" {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
}));

describe('ReasonChart', () => {
  it('returns null when reasons array is empty', () => {
    const { container } = render(<ReasonChart reasons={[]} title="Top Reasons" />);
    expect(container.innerHTML).toBe('');
  });

  it('renders the chart title', () => {
    render(<ReasonChart reasons={[{ reason: 'Work', count: 5 }]} title="晚睡原因 Top 5" />);
    expect(screen.getByText('晚睡原因 Top 5')).toBeInTheDocument();
  });

  it('renders all reason labels', () => {
    const reasons = [
      { reason: '工作', count: 10 },
      { reason: '手机', count: 7 },
      { reason: '游戏', count: 3 },
    ];
    render(<ReasonChart reasons={reasons} title="Top Reasons" />);
    expect(screen.getByText('工作')).toBeInTheDocument();
    expect(screen.getByText('手机')).toBeInTheDocument();
    expect(screen.getByText('游戏')).toBeInTheDocument();
  });

  it('renders count numbers', () => {
    const reasons = [
      { reason: '工作', count: 10 },
      { reason: '手机', count: 7 },
    ];
    render(<ReasonChart reasons={reasons} title="Top Reasons" />);
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('highest count item has bar width 100%', () => {
    const reasons = [
      { reason: '工作', count: 10 },
      { reason: '手机', count: 5 },
    ];
    const { container } = render(<ReasonChart reasons={reasons} title="Top Reasons" />);
    const bars = container.querySelectorAll('[style*="width"]');
    expect(bars).toHaveLength(2);
    expect(bars[0].getAttribute('style')).toContain('width: 100%');
    expect(bars[1].getAttribute('style')).toContain('width: 50%');
  });

  it('single reason has bar width 100%', () => {
    const { container } = render(
      <ReasonChart reasons={[{ reason: 'Only One', count: 3 }]} title="Top Reasons" />
    );
    const bar = container.querySelector('[style*="width"]');
    expect(bar).not.toBeNull();
    expect(bar!.getAttribute('style')).toContain('width: 100%');
  });
});
