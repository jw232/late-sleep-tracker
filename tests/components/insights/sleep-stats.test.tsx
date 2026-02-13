import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SleepStats } from '@/components/insights/sleep-stats';

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div data-testid="card" {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
}));

const mockT = {
  sleepStats: '入睡统计',
  average: '平均时间',
  earliest: '最早',
  latest: '最晚',
  trend: '趋势',
};

describe('SleepStats', () => {
  it('renders avg, earliest, and latest time values', () => {
    const stats = { avgTime: '01:30', earliestTime: '23:00', latestTime: '03:15' };
    render(<SleepStats stats={stats} trend={[]} t={mockT} />);
    expect(screen.getByText('01:30')).toBeInTheDocument();
    expect(screen.getByText('23:00')).toBeInTheDocument();
    expect(screen.getByText('03:15')).toBeInTheDocument();
  });

  it('renders --:-- when stats are empty strings', () => {
    const stats = { avgTime: '', earliestTime: '', latestTime: '' };
    render(<SleepStats stats={stats} trend={[]} t={mockT} />);
    const placeholders = screen.getAllByText('--:--');
    expect(placeholders).toHaveLength(3);
  });

  it('renders trend bars when trend data is present', () => {
    const stats = { avgTime: '01:00', earliestTime: '23:30', latestTime: '02:00' };
    const trend = [
      { date: '2026-02-01', time: '01:00' },
      { date: '2026-02-02', time: '01:30' },
    ];
    render(<SleepStats stats={stats} trend={trend} t={mockT} />);
    expect(screen.getByText('趋势')).toBeInTheDocument();
    // Trend bars are rendered with height style
    const { container } = render(<SleepStats stats={stats} trend={trend} t={mockT} />);
    const bars = container.querySelectorAll('[style*="height"]');
    expect(bars.length).toBeGreaterThan(0);
  });

  it('does not render trend area when trend is empty', () => {
    const stats = { avgTime: '01:00', earliestTime: '23:30', latestTime: '02:00' };
    render(<SleepStats stats={stats} trend={[]} t={mockT} />);
    expect(screen.queryByText('趋势')).not.toBeInTheDocument();
  });

  it('shows tooltip with date and time on hover', () => {
    const stats = { avgTime: '01:00', earliestTime: '23:30', latestTime: '02:00' };
    const trend = [
      { date: '2026-02-05', time: '01:15' },
      { date: '2026-02-06', time: '02:00' },
    ];
    const { container } = render(<SleepStats stats={stats} trend={trend} t={mockT} />);
    // Find the bar containers (elements with onMouseEnter)
    const barContainers = container.querySelectorAll('[style*="height"]');
    // The parent of the bar div has the mouse handlers
    const firstBarParent = barContainers[0]?.parentElement;
    if (firstBarParent) {
      fireEvent.mouseEnter(firstBarParent);
    }
    // Tooltip should show date slice(5) = '02-05' and time slice(0,5) = '01:15'
    expect(screen.getByText('02-05 01:15')).toBeInTheDocument();
  });

  it('handles time before 12:00 correctly for bar height', () => {
    const stats = { avgTime: '02:00', earliestTime: '02:00', latestTime: '02:00' };
    const trend = [{ date: '2026-02-01', time: '02:00' }];
    const { container } = render(<SleepStats stats={stats} trend={trend} t={mockT} />);
    // Time 02:00 is before 12, so timeToMin adds 24*60: 2*60+0+1440 = 1560
    // With single item: minMin = 1560-30 = 1530, maxMin = 1560+30 = 1590, range = 60
    // height = ((1560 - 1530) / 60) * 100 = 50%
    const bars = container.querySelectorAll('[style*="height"]');
    expect(bars.length).toBeGreaterThan(0);
    expect(bars[0].getAttribute('style')).toContain('height: 50%');
  });
});
