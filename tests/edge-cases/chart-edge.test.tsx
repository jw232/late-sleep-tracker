import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReasonChart } from '@/components/insights/reason-chart';

vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
}));

describe('ReasonChart edge cases', () => {
  it('single reason count=1 → bar width 100%', () => {
    const { container } = render(
      <ReasonChart reasons={[{ reason: 'Gaming', count: 1 }]} title="Top Reasons" />
    );
    const bar = container.querySelector('[style*="width"]');
    expect(bar).not.toBeNull();
    expect(bar!.getAttribute('style')).toContain('width: 100%');
  });

  it('single item renders correctly', () => {
    render(
      <ReasonChart reasons={[{ reason: 'Work', count: 5 }]} title="Top Reasons" />
    );
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('very long reason text does not crash', () => {
    const longReason = 'A'.repeat(500);
    const { container } = render(
      <ReasonChart reasons={[{ reason: longReason, count: 3 }]} title="Top Reasons" />
    );
    expect(screen.getByText(longReason)).toBeInTheDocument();
    expect(container.querySelector('[data-testid="card"]')).toBeInTheDocument();
  });
});
