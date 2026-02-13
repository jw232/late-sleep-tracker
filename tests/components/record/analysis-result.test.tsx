import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnalysisResult } from '@/components/record/analysis-result';

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div data-testid="card" {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
}));

const mockT = {
  title: 'AI Analysis',
  mainReasons: 'Main Reasons',
  confidence: 'Confidence',
  suggestions: 'Suggestions',
  tags: 'Tags',
};

const mockAnalysis = {
  top_reasons: [
    { reason: '工作', confidence: 85 },
    { reason: '手机', confidence: 60 },
  ],
  suggestions: ['早点下班', '放下手机'],
  tags: ['work', 'phone'],
};

describe('AnalysisResult', () => {
  it('renders title from t.title', () => {
    render(<AnalysisResult analysis={mockAnalysis} t={mockT} />);
    expect(screen.getByText('AI Analysis')).toBeInTheDocument();
  });

  it('renders all reason texts', () => {
    render(<AnalysisResult analysis={mockAnalysis} t={mockT} />);
    expect(screen.getByText('工作')).toBeInTheDocument();
    expect(screen.getByText('手机')).toBeInTheDocument();
  });

  it('renders confidence percentages', () => {
    render(<AnalysisResult analysis={mockAnalysis} t={mockT} />);
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('renders confidence progress bars with correct width style', () => {
    const { container } = render(<AnalysisResult analysis={mockAnalysis} t={mockT} />);
    const bars = container.querySelectorAll('[style*="width"]');
    expect(bars).toHaveLength(2);
    expect(bars[0].getAttribute('style')).toContain('width: 85%');
    expect(bars[1].getAttribute('style')).toContain('width: 60%');
  });

  it('renders all suggestions', () => {
    render(<AnalysisResult analysis={mockAnalysis} t={mockT} />);
    expect(screen.getByText('早点下班')).toBeInTheDocument();
    expect(screen.getByText('放下手机')).toBeInTheDocument();
  });

  it('renders all tags', () => {
    render(<AnalysisResult analysis={mockAnalysis} t={mockT} />);
    expect(screen.getByText('work')).toBeInTheDocument();
    expect(screen.getByText('phone')).toBeInTheDocument();
  });

  it('does not crash with empty top_reasons', () => {
    const emptyReasons = { ...mockAnalysis, top_reasons: [] };
    const { container } = render(<AnalysisResult analysis={emptyReasons} t={mockT} />);
    expect(container).toBeTruthy();
    expect(screen.getByText('Main Reasons')).toBeInTheDocument();
  });

  it('does not crash with empty suggestions', () => {
    const emptySuggestions = { ...mockAnalysis, suggestions: [] };
    const { container } = render(<AnalysisResult analysis={emptySuggestions} t={mockT} />);
    expect(container).toBeTruthy();
    expect(screen.getByText('Suggestions')).toBeInTheDocument();
  });
});
