import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AISummary } from '@/components/insights/ai-summary';
import type { PatternAnalysis } from '@/types';

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div data-testid="card" {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
}));

vi.mock('lucide-react', () => ({
  TrendingUp: () => <span data-testid="trending-up">↑</span>,
  TrendingDown: () => <span data-testid="trending-down">↓</span>,
  Minus: () => <span data-testid="minus">-</span>,
}));

const mockT = {
  aiAnalysis: 'AI 分析',
  patterns: '行为模式',
  evidence: '证据',
  frequency: '频率',
  weekdayAnalysis: '星期分析',
  worstDay: '最差日',
  trendDirection: '趋势方向',
  improving: '改善中',
  worsening: '恶化中',
  stable: '稳定',
  advice: '建议',
};

const mockAnalysis: PatternAnalysis = {
  patterns: [
    { name: '深夜加班模式', evidence: '过去7天有5天加班', frequency: '高频' },
  ],
  weekday_analysis: { worst_day: '周五', analysis: '周五晚上最容易熬夜' },
  trend: 'improving',
  actionable_advice: ['设置工作截止时间', '睡前放下手机'],
};

describe('AISummary', () => {
  it('renders AI analysis title', () => {
    render(<AISummary analysis={mockAnalysis} t={mockT} />);
    expect(screen.getByText('AI 分析')).toBeInTheDocument();
  });

  it('renders pattern name, evidence, and frequency', () => {
    render(<AISummary analysis={mockAnalysis} t={mockT} />);
    expect(screen.getByText('深夜加班模式')).toBeInTheDocument();
    expect(screen.getByText('证据: 过去7天有5天加班')).toBeInTheDocument();
    expect(screen.getByText('频率: 高频')).toBeInTheDocument();
  });

  it('renders weekday analysis with worst_day and analysis text', () => {
    render(<AISummary analysis={mockAnalysis} t={mockT} />);
    expect(screen.getByText('周五')).toBeInTheDocument();
    expect(screen.getByText('周五晚上最容易熬夜')).toBeInTheDocument();
  });

  it('renders TrendingDown icon when trend is improving', () => {
    render(<AISummary analysis={{ ...mockAnalysis, trend: 'improving' }} t={mockT} />);
    expect(screen.getByTestId('trending-down')).toBeInTheDocument();
    expect(screen.getByText('改善中')).toBeInTheDocument();
  });

  it('renders TrendingUp icon when trend is worsening', () => {
    render(<AISummary analysis={{ ...mockAnalysis, trend: 'worsening' }} t={mockT} />);
    expect(screen.getByTestId('trending-up')).toBeInTheDocument();
    expect(screen.getByText('恶化中')).toBeInTheDocument();
  });

  it('renders Minus icon when trend is stable', () => {
    render(<AISummary analysis={{ ...mockAnalysis, trend: 'stable' }} t={mockT} />);
    expect(screen.getByTestId('minus')).toBeInTheDocument();
    expect(screen.getByText('稳定')).toBeInTheDocument();
  });

  it('renders numbered actionable advice list', () => {
    render(<AISummary analysis={mockAnalysis} t={mockT} />);
    expect(screen.getByText('1.')).toBeInTheDocument();
    expect(screen.getByText('设置工作截止时间')).toBeInTheDocument();
    expect(screen.getByText('2.')).toBeInTheDocument();
    expect(screen.getByText('睡前放下手机')).toBeInTheDocument();
  });
});
