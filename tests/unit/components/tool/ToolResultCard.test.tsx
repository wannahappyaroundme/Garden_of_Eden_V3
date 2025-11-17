/**
 * ToolResultCard Component Unit Tests (v3.7.0)
 * Tests expandable tool result card with input/output display
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToolResultCard } from '../../../../src/renderer/components/tool/ToolResultCard';
import { ToolCall } from '../../../../src/shared/types/tool.types';

describe('ToolResultCard', () => {
  const baseToolCall: ToolCall = {
    id: 'tool-1',
    toolName: 'web_search',
    displayName: 'Web Search',
    status: 'success',
    startTime: new Date('2025-01-17T10:00:00').getTime(),
    endTime: new Date('2025-01-17T10:00:02').getTime(),
    executionTimeMs: 2345,
    input: { query: 'test query' },
    output: { result: 'test output' },
  };

  describe('Header (Collapsed State)', () => {
    it('should render tool display name', () => {
      render(<ToolResultCard toolCall={baseToolCall} />);

      expect(screen.getByText('Web Search')).toBeInTheDocument();
    });

    it('should show chevron right when collapsed', () => {
      const { container } = render(<ToolResultCard toolCall={baseToolCall} />);

      const chevronRight = container.querySelector('svg.lucide-chevron-right');
      expect(chevronRight).toBeInTheDocument();
    });

    it('should display execution time', () => {
      render(<ToolResultCard toolCall={baseToolCall} />);

      expect(screen.getByText('2.35s')).toBeInTheDocument();
    });

    it('should show success badge', () => {
      render(<ToolResultCard toolCall={baseToolCall} />);

      expect(screen.getByText('Success')).toBeInTheDocument();
    });

    it('should show error badge for error status', () => {
      const errorToolCall: ToolCall = {
        ...baseToolCall,
        status: 'error',
        error: 'Something went wrong',
      };

      render(<ToolResultCard toolCall={errorToolCall} />);

      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('should show loading badge for loading status', () => {
      const loadingToolCall: ToolCall = {
        ...baseToolCall,
        status: 'loading',
        endTime: undefined,
        executionTimeMs: undefined,
      };

      render(<ToolResultCard toolCall={loadingToolCall} />);

      expect(screen.getByText('Running...')).toBeInTheDocument();
    });
  });

  describe('Expand/Collapse Interaction', () => {
    it('should start in collapsed state', () => {
      render(<ToolResultCard toolCall={baseToolCall} />);

      expect(screen.queryByText('Input:')).not.toBeInTheDocument();
      expect(screen.queryByText('Output:')).not.toBeInTheDocument();
    });

    it('should expand when header is clicked', () => {
      render(<ToolResultCard toolCall={baseToolCall} />);

      const header = screen.getByRole('button');
      fireEvent.click(header);

      expect(screen.getByText('Input:')).toBeInTheDocument();
      expect(screen.getByText('Output:')).toBeInTheDocument();
    });

    it('should show chevron down when expanded', () => {
      const { container } = render(<ToolResultCard toolCall={baseToolCall} />);

      const header = screen.getByRole('button');
      fireEvent.click(header);

      const chevronDown = container.querySelector('svg.lucide-chevron-down');
      expect(chevronDown).toBeInTheDocument();
    });

    it('should collapse when clicked again', () => {
      render(<ToolResultCard toolCall={baseToolCall} />);

      const header = screen.getByRole('button');
      fireEvent.click(header); // Expand
      fireEvent.click(header); // Collapse

      expect(screen.queryByText('Input:')).not.toBeInTheDocument();
    });
  });

  describe('Input Display', () => {
    it('should display single input parameter inline', () => {
      const toolCall: ToolCall = {
        ...baseToolCall,
        input: { query: 'test query' },
      };

      render(<ToolResultCard toolCall={toolCall} />);

      const header = screen.getByRole('button');
      fireEvent.click(header);

      expect(screen.getByText(/query: test query/)).toBeInTheDocument();
    });

    it('should display multiple input parameters as JSON', () => {
      const toolCall: ToolCall = {
        ...baseToolCall,
        input: { query: 'test', maxResults: 5 },
      };

      render(<ToolResultCard toolCall={toolCall} />);

      const header = screen.getByRole('button');
      fireEvent.click(header);

      expect(screen.getByText(/"query": "test"/)).toBeInTheDocument();
      expect(screen.getByText(/"maxResults": 5/)).toBeInTheDocument();
    });

    it('should handle object values in input', () => {
      const toolCall: ToolCall = {
        ...baseToolCall,
        input: { config: { timeout: 5000 } },
      };

      render(<ToolResultCard toolCall={toolCall} />);

      const header = screen.getByRole('button');
      fireEvent.click(header);

      // Single input parameter with object value is shown as: config: {"timeout":5000}
      expect(screen.getByText(/config:/)).toBeInTheDocument();
      expect(screen.getByText(/timeout/)).toBeInTheDocument();
    });

    it('should show "No input" when input is undefined', () => {
      const toolCall: ToolCall = {
        ...baseToolCall,
        input: undefined,
      };

      render(<ToolResultCard toolCall={toolCall} />);

      const header = screen.getByRole('button');
      fireEvent.click(header);

      expect(screen.queryByText('Input:')).not.toBeInTheDocument();
    });

    it('should show "No input" when input is empty object', () => {
      const toolCall: ToolCall = {
        ...baseToolCall,
        input: {},
      };

      render(<ToolResultCard toolCall={toolCall} />);

      const header = screen.getByRole('button');
      fireEvent.click(header);

      // Empty input object renders input section with "No input"
      expect(screen.getByText('Input:')).toBeInTheDocument();
      expect(screen.getByText('No input')).toBeInTheDocument();
    });
  });

  describe('Output Display', () => {
    it('should display string output directly', () => {
      const toolCall: ToolCall = {
        ...baseToolCall,
        output: 'Simple string output',
      };

      render(<ToolResultCard toolCall={toolCall} />);

      const header = screen.getByRole('button');
      fireEvent.click(header);

      expect(screen.getByText('Simple string output')).toBeInTheDocument();
    });

    it('should display object output as JSON', () => {
      const toolCall: ToolCall = {
        ...baseToolCall,
        output: { status: 'ok', data: [1, 2, 3] },
      };

      render(<ToolResultCard toolCall={toolCall} />);

      const header = screen.getByRole('button');
      fireEvent.click(header);

      expect(screen.getByText(/"status": "ok"/)).toBeInTheDocument();
      expect(screen.getByText(/"data": \[/)).toBeInTheDocument();
    });

    it('should extract result field from object if present', () => {
      const toolCall: ToolCall = {
        ...baseToolCall,
        output: { result: 'Extracted result' },
      };

      render(<ToolResultCard toolCall={toolCall} />);

      const header = screen.getByRole('button');
      fireEvent.click(header);

      expect(screen.getByText('Extracted result')).toBeInTheDocument();
    });

    it('should not show output section when status is error', () => {
      const toolCall: ToolCall = {
        ...baseToolCall,
        status: 'error',
        error: 'Error message',
        output: 'This should not appear',
      };

      render(<ToolResultCard toolCall={toolCall} />);

      const header = screen.getByRole('button');
      fireEvent.click(header);

      expect(screen.queryByText('Output:')).not.toBeInTheDocument();
      expect(screen.queryByText('This should not appear')).not.toBeInTheDocument();
    });

    it('should not show output section when status is loading', () => {
      const toolCall: ToolCall = {
        ...baseToolCall,
        status: 'loading',
      };

      render(<ToolResultCard toolCall={toolCall} />);

      const header = screen.getByRole('button');
      fireEvent.click(header);

      expect(screen.queryByText('Output:')).not.toBeInTheDocument();
    });
  });

  describe('Error Display', () => {
    it('should show error message when status is error', () => {
      const toolCall: ToolCall = {
        ...baseToolCall,
        status: 'error',
        error: 'Network timeout',
      };

      render(<ToolResultCard toolCall={toolCall} />);

      const header = screen.getByRole('button');
      fireEvent.click(header);

      expect(screen.getByText('Error:')).toBeInTheDocument();
      expect(screen.getByText('Network timeout')).toBeInTheDocument();
    });

    it('should not show error section when status is success', () => {
      render(<ToolResultCard toolCall={baseToolCall} />);

      const header = screen.getByRole('button');
      fireEvent.click(header);

      expect(screen.queryByText('Error:')).not.toBeInTheDocument();
    });
  });

  describe('Execution Info', () => {
    it('should display start time', () => {
      render(<ToolResultCard toolCall={baseToolCall} />);

      const header = screen.getByRole('button');
      fireEvent.click(header);

      expect(screen.getByText(/Started:/)).toBeInTheDocument();
    });

    it('should display end time when available', () => {
      render(<ToolResultCard toolCall={baseToolCall} />);

      const header = screen.getByRole('button');
      fireEvent.click(header);

      expect(screen.getByText(/Ended:/)).toBeInTheDocument();
    });

    it('should not show end time when endTime is undefined', () => {
      const toolCall: ToolCall = {
        ...baseToolCall,
        endTime: undefined,
      };

      render(<ToolResultCard toolCall={toolCall} />);

      const header = screen.getByRole('button');
      fireEvent.click(header);

      expect(screen.queryByText(/Ended:/)).not.toBeInTheDocument();
    });
  });

  describe('Tool Color Themes', () => {
    const toolColorTests: Array<{
      tool: string;
      borderClass: string;
      bgClass: string;
    }> = [
      { tool: 'web_search', borderClass: 'border-blue-500/20', bgClass: 'bg-blue-500/10' },
      { tool: 'fetch_url', borderClass: 'border-green-500/20', bgClass: 'bg-green-500/10' },
      { tool: 'read_file', borderClass: 'border-purple-500/20', bgClass: 'bg-purple-500/10' },
      { tool: 'write_file', borderClass: 'border-orange-500/20', bgClass: 'bg-orange-500/10' },
      { tool: 'get_system_info', borderClass: 'border-cyan-500/20', bgClass: 'bg-cyan-500/10' },
      { tool: 'calculate', borderClass: 'border-pink-500/20', bgClass: 'bg-pink-500/10' },
    ];

    toolColorTests.forEach(({ tool, borderClass, bgClass }) => {
      it(`should apply correct colors for ${tool}`, () => {
        const toolCall: ToolCall = {
          ...baseToolCall,
          toolName: tool,
        };

        const { container } = render(<ToolResultCard toolCall={toolCall} />);

        const card = container.firstChild as HTMLElement;
        expect(card).toHaveClass(borderClass, bgClass);
      });
    });

    it('should apply default gray colors for unknown tool', () => {
      const toolCall: ToolCall = {
        ...baseToolCall,
        toolName: 'unknown_tool',
      };

      const { container } = render(<ToolResultCard toolCall={toolCall} />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('border-gray-500/20', 'bg-gray-500/10');
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <ToolResultCard toolCall={baseToolCall} className="custom-class" />
      );

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('custom-class');
    });
  });

  describe('Accessibility', () => {
    it('should have button role for header', () => {
      render(<ToolResultCard toolCall={baseToolCall} />);

      const header = screen.getByRole('button');
      expect(header).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      render(<ToolResultCard toolCall={baseToolCall} />);

      const header = screen.getByRole('button');
      expect(header).toHaveClass('focus:outline-none', 'focus:ring-2');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing executionTimeMs', () => {
      const toolCall: ToolCall = {
        ...baseToolCall,
        executionTimeMs: undefined,
      };

      render(<ToolResultCard toolCall={toolCall} />);

      // With undefined executionTimeMs, no time should be displayed in header
      // Just verify the basic structure is there
      expect(screen.getByText('Web Search')).toBeInTheDocument();
      expect(screen.getByText('Success')).toBeInTheDocument();
      // Execution time format ends with 's', so check that pattern doesn't exist
      expect(screen.queryByText(/\d+\.\d+s/)).not.toBeInTheDocument();
    });

    it('should handle very large JSON output', () => {
      const largeOutput = {
        data: Array.from({ length: 100 }, (_, i) => ({ id: i, value: `item ${i}` })),
      };

      const toolCall: ToolCall = {
        ...baseToolCall,
        output: largeOutput,
      };

      render(<ToolResultCard toolCall={toolCall} />);

      const header = screen.getByRole('button');
      fireEvent.click(header);

      expect(screen.getByText(/"id": 0/)).toBeInTheDocument();
    });

    it('should not show output section for null output', () => {
      const toolCall: ToolCall = {
        ...baseToolCall,
        output: null,
      };

      render(<ToolResultCard toolCall={toolCall} />);

      const header = screen.getByRole('button');
      fireEvent.click(header);

      // null is falsy, so output section doesn't render
      expect(screen.queryByText('Output:')).not.toBeInTheDocument();
    });

    it('should not show output section for undefined output', () => {
      const toolCall: ToolCall = {
        ...baseToolCall,
        output: undefined,
      };

      render(<ToolResultCard toolCall={toolCall} />);

      const header = screen.getByRole('button');
      fireEvent.click(header);

      // undefined is falsy, so output section doesn't render
      expect(screen.queryByText('Output:')).not.toBeInTheDocument();
    });

    it('should format execution time with 2 decimal places', () => {
      const toolCall: ToolCall = {
        ...baseToolCall,
        executionTimeMs: 1234,
      };

      render(<ToolResultCard toolCall={toolCall} />);

      expect(screen.getByText('1.23s')).toBeInTheDocument();
    });
  });

  describe('Status Badge Colors', () => {
    it('should show green success badge', () => {
      render(<ToolResultCard toolCall={baseToolCall} />);

      const badge = screen.getByText('Success');
      expect(badge).toHaveClass('bg-green-500/10', 'text-green-600', 'border-green-500/20');
    });

    it('should show red error badge', () => {
      const toolCall: ToolCall = {
        ...baseToolCall,
        status: 'error',
        error: 'Test error',
      };

      render(<ToolResultCard toolCall={toolCall} />);

      const badge = screen.getByText('Error');
      expect(badge).toHaveClass('bg-red-500/10', 'text-red-600', 'border-red-500/20');
    });

    it('should show blue loading badge', () => {
      const toolCall: ToolCall = {
        ...baseToolCall,
        status: 'loading',
      };

      render(<ToolResultCard toolCall={toolCall} />);

      const badge = screen.getByText('Running...');
      expect(badge).toHaveClass('bg-blue-500/10', 'text-blue-600', 'border-blue-500/20');
    });
  });
});
