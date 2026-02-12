import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StreakCard } from '@/components/record/streak-card';

const mockT = {
  streak: '连续记录',
  streakDays: '天',
  streakMessages: [
    '开始记录吧！',
    '好的开始！',
    '继续保持！',
    '太棒了！',
    '非常优秀！',
    '你是最棒的！',
  ],
};

describe('StreakCard', () => {
  it('shows first motivational message when streak is 0', () => {
    render(<StreakCard streak={0} t={mockT} />);
    expect(screen.getByText('开始记录吧！', { exact: false })).toBeInTheDocument();
  });

  it('shows number 5 and "天" when streak is 5', () => {
    render(<StreakCard streak={5} t={mockT} />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('天')).toBeInTheDocument();
  });

  it('shows highest-level message when streak is 10 (capped)', () => {
    render(<StreakCard streak={10} t={mockT} />);
    expect(screen.getByText('你是最棒的！', { exact: false })).toBeInTheDocument();
  });

  it('renders the Flame icon (SVG element)', () => {
    const { container } = render(<StreakCard streak={0} t={mockT} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
