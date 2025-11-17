/**
 * ToolCallIndicator Component Unit Tests (v3.7.0)
 * Tests tool usage indicator display and status transitions
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ToolCallIndicator } from '../../../../src/renderer/components/tool/ToolCallIndicator';
import { ToolStatus } from '../../../../src/shared/types/tool.types';

describe('ToolCallIndicator', () => {
  describe('Display Names', () => {
    it('should display known tool name correctly', () => {
      render(
        <ToolCallIndicator toolName="web_search" status="loading" />
      );

      expect(screen.getByText(/Using Web Search\.\.\./)).toBeInTheDocument();
    });

    it('should display unknown tool name as-is', () => {
      render(
        <ToolCallIndicator toolName="custom_tool" status="loading" />
      );

      expect(screen.getByText(/Using custom_tool\.\.\./)).toBeInTheDocument();
    });
  });

  describe('Status: Loading', () => {
    it('should show loading spinner', () => {
      const { container } = render(
        <ToolCallIndicator toolName="web_search" status="loading" />
      );

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should show "Using [tool]..." text', () => {
      render(
        <ToolCallIndicator toolName="read_file" status="loading" />
      );

      expect(screen.getByText('Using Read File...')).toBeInTheDocument();
    });

    it('should apply loading state classes', () => {
      const { container } = render(
        <ToolCallIndicator toolName="web_search" status="loading" />
      );

      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-blue-500/10', 'text-blue-600', 'border-blue-500/20');
    });
  });

  describe('Status: Success', () => {
    it('should show checkmark icon', () => {
      const { container } = render(
        <ToolCallIndicator toolName="web_search" status="success" />
      );

      const checkmark = container.querySelector('svg path[d*="M5 13l4 4L19 7"]');
      expect(checkmark).toBeInTheDocument();
    });

    it('should show tool name without "Using..." prefix', () => {
      render(
        <ToolCallIndicator toolName="web_search" status="success" />
      );

      expect(screen.getByText('Web Search')).toBeInTheDocument();
    });

    it('should display execution time when provided', () => {
      render(
        <ToolCallIndicator
          toolName="web_search"
          status="success"
          executionTime={2345}
        />
      );

      expect(screen.getByText('Web Search (2.3s)')).toBeInTheDocument();
    });

    it('should format execution time to 1 decimal place', () => {
      render(
        <ToolCallIndicator
          toolName="web_search"
          status="success"
          executionTime={1567}
        />
      );

      expect(screen.getByText('Web Search (1.6s)')).toBeInTheDocument();
    });
  });

  describe('Status: Error', () => {
    it('should show X icon', () => {
      const { container } = render(
        <ToolCallIndicator toolName="web_search" status="error" />
      );

      const xMark = container.querySelector('svg path[d*="M6 18L18 6M6 6l12 12"]');
      expect(xMark).toBeInTheDocument();
    });

    it('should show "[tool] failed" text', () => {
      render(
        <ToolCallIndicator toolName="web_search" status="error" />
      );

      expect(screen.getByText('Web Search failed')).toBeInTheDocument();
    });

    it('should override tool color with error red', () => {
      const { container } = render(
        <ToolCallIndicator toolName="web_search" status="error" />
      );

      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-red-500/10', 'text-red-600', 'border-red-500/20');
    });
  });

  describe('Tool Color Themes', () => {
    const toolColorTests: Array<{
      tool: string;
      expectedClasses: string[];
    }> = [
      {
        tool: 'web_search',
        expectedClasses: ['bg-blue-500/10', 'text-blue-600', 'border-blue-500/20'],
      },
      {
        tool: 'fetch_url',
        expectedClasses: ['bg-green-500/10', 'text-green-600', 'border-green-500/20'],
      },
      {
        tool: 'read_file',
        expectedClasses: ['bg-purple-500/10', 'text-purple-600', 'border-purple-500/20'],
      },
      {
        tool: 'write_file',
        expectedClasses: ['bg-orange-500/10', 'text-orange-600', 'border-orange-500/20'],
      },
      {
        tool: 'get_system_info',
        expectedClasses: ['bg-cyan-500/10', 'text-cyan-600', 'border-cyan-500/20'],
      },
      {
        tool: 'calculate',
        expectedClasses: ['bg-pink-500/10', 'text-pink-600', 'border-pink-500/20'],
      },
    ];

    toolColorTests.forEach(({ tool, expectedClasses }) => {
      it(`should apply correct colors for ${tool}`, () => {
        const { container } = render(
          <ToolCallIndicator toolName={tool} status="loading" />
        );

        const badge = container.firstChild as HTMLElement;
        expectedClasses.forEach((className) => {
          expect(badge).toHaveClass(className);
        });
      });
    });

    it('should apply default gray colors for unknown tool', () => {
      const { container } = render(
        <ToolCallIndicator toolName="unknown_tool" status="loading" />
      );

      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-gray-500/10', 'text-gray-600', 'border-gray-500/20');
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <ToolCallIndicator
          toolName="web_search"
          status="loading"
          className="custom-class"
        />
      );

      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('custom-class');
    });

    it('should preserve built-in classes when custom className is provided', () => {
      const { container } = render(
        <ToolCallIndicator
          toolName="web_search"
          status="loading"
          className="custom-class"
        />
      );

      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('custom-class', 'inline-flex', 'items-center', 'rounded-full');
    });
  });

  describe('Accessibility', () => {
    it('should have appropriate semantic structure', () => {
      const { container } = render(
        <ToolCallIndicator toolName="web_search" status="loading" />
      );

      const badge = container.firstChild as HTMLElement;
      expect(badge.tagName).toBe('DIV');
      expect(badge).toHaveClass('inline-flex', 'items-center');
    });

    it('should render text content', () => {
      render(
        <ToolCallIndicator toolName="web_search" status="success" executionTime={1000} />
      );

      expect(screen.getByText('Web Search (1.0s)')).toBeInTheDocument();
    });
  });

  describe('Animation and Transitions', () => {
    it('should have transition classes', () => {
      const { container } = render(
        <ToolCallIndicator toolName="web_search" status="loading" />
      );

      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('transition-all', 'duration-200');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero execution time as falsy and not show time', () => {
      render(
        <ToolCallIndicator
          toolName="web_search"
          status="success"
          executionTime={0}
        />
      );

      // executionTime of 0 is falsy, so time is not displayed
      expect(screen.getByText('Web Search')).toBeInTheDocument();
      expect(screen.queryByText(/\(0\.0s\)/)).not.toBeInTheDocument();
    });

    it('should handle very large execution times', () => {
      render(
        <ToolCallIndicator
          toolName="web_search"
          status="success"
          executionTime={99999}
        />
      );

      expect(screen.getByText('Web Search (100.0s)')).toBeInTheDocument();
    });

    it('should handle execution time undefined in success state', () => {
      render(
        <ToolCallIndicator
          toolName="web_search"
          status="success"
        />
      );

      expect(screen.getByText('Web Search')).toBeInTheDocument();
    });
  });
});
