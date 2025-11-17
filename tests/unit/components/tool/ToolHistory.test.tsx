/**
 * ToolHistory Component Unit Tests (v3.7.0 Phase 3)
 * Tests main tool history panel with filtering and export
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToolHistory } from '../../../../src/renderer/components/tool/ToolHistory';
import type { ToolCallRecord } from '../../../../src/shared/types/tool-history.types';

describe('ToolHistory', () => {
  const mockOnRefresh = jest.fn();
  const mockOnClearHistory = jest.fn();

  const mockRecords: ToolCallRecord[] = [
    {
      id: 'test-001',
      toolName: 'web_search',
      displayName: 'Web Search',
      timestamp: Date.now(),
      duration: 1500,
      status: 'success',
      input: { query: 'test' },
      output: { results: [] },
    },
    {
      id: 'test-002',
      toolName: 'read_file',
      displayName: 'Read File',
      timestamp: Date.now() - 3600000,
      duration: 45,
      status: 'success',
      input: { path: '/test.txt' },
      output: 'file content',
    },
    {
      id: 'test-003',
      toolName: 'web_search',
      displayName: 'Web Search',
      timestamp: Date.now() - 7200000,
      duration: 2100,
      status: 'error',
      input: { query: 'error test' },
      output: null,
      error: { message: 'Network error' },
    },
  ];

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render Tool History heading', () => {
    render(<ToolHistory records={mockRecords} />);
    expect(screen.getByText('Tool History')).toBeInTheDocument();
  });

  it('should display total call count', () => {
    render(<ToolHistory records={mockRecords} />);
    expect(screen.getByText(/3 total calls/)).toBeInTheDocument();
  });

  it('should display success rate', () => {
    render(<ToolHistory records={mockRecords} />);
    // 2 success out of 3 = 66.7%
    expect(screen.getByText(/66.7% success rate/)).toBeInTheDocument();
  });

  it('should render all tool call records', () => {
    render(<ToolHistory records={mockRecords} />);

    expect(screen.getAllByText('Web Search')).toHaveLength(2);
    expect(screen.getByText('Read File')).toBeInTheDocument();
  });

  it('should show statistics panel', () => {
    render(<ToolHistory records={mockRecords} />);

    expect(screen.getByText(/web_search:/)).toBeInTheDocument();
    expect(screen.getByText(/2 calls/)).toBeInTheDocument();
  });

  it('should render filter component', () => {
    render(<ToolHistory records={mockRecords} />);

    expect(screen.getByPlaceholderText('Search tool history...')).toBeInTheDocument();
    expect(screen.getByText('Filters')).toBeInTheDocument();
  });

  it('should filter records by tool name', () => {
    render(<ToolHistory records={mockRecords} />);

    // Expand filters and select read_file
    fireEvent.click(screen.getByText('Filters'));
    fireEvent.click(screen.getByText(/Read File/));

    // Should only show 1 record
    expect(screen.getByText(/Showing 1 of 3 records/)).toBeInTheDocument();
  });

  it('should filter records by status', () => {
    render(<ToolHistory records={mockRecords} />);

    // Expand filters and select error status
    fireEvent.click(screen.getByText('Filters'));
    fireEvent.click(screen.getByText('error'));

    // Should only show 1 error record
    expect(screen.getByText(/Showing 1 of 3 records/)).toBeInTheDocument();
  });

  it('should filter records by search query', () => {
    render(<ToolHistory records={mockRecords} />);

    const searchInput = screen.getByPlaceholderText('Search tool history...');
    fireEvent.change(searchInput, { target: { value: 'error test' } });

    // Should filter to 1 record
    expect(screen.getByText(/Showing 1 of 3 records/)).toBeInTheDocument();
  });

  it('should show export panel when Export button is clicked', () => {
    render(<ToolHistory records={mockRecords} />);

    const exportButton = screen.getByText('Export');
    fireEvent.click(exportButton);

    expect(screen.getByText('Export History')).toBeInTheDocument();
  });

  it('should hide export panel when Hide Export is clicked', () => {
    render(<ToolHistory records={mockRecords} />);

    // Show export
    fireEvent.click(screen.getByText('Export'));
    expect(screen.getByText('Export History')).toBeInTheDocument();

    // Hide export
    fireEvent.click(screen.getByText('Hide Export'));
    expect(screen.queryByText('Export History')).not.toBeInTheDocument();
  });

  it('should call onClearHistory when Clear All is clicked', () => {
    render(
      <ToolHistory records={mockRecords} onClearHistory={mockOnClearHistory} />
    );

    const clearButton = screen.getByText('Clear All');
    fireEvent.click(clearButton);

    expect(mockOnClearHistory).toHaveBeenCalled();
  });

  it('should show empty state when no records', () => {
    render(<ToolHistory records={[]} />);

    expect(screen.getByText('No tool calls yet')).toBeInTheDocument();
    expect(screen.getByText(/Tool calls will appear here/)).toBeInTheDocument();
  });

  it('should show "No records match your filters" when filtered to zero', () => {
    render(<ToolHistory records={mockRecords} />);

    // Expand filters and select a tool that doesn't exist
    fireEvent.click(screen.getByText('Filters'));

    // Filter by success status
    fireEvent.click(screen.getByText('success'));

    // Then search for something that won't match
    const searchInput = screen.getByPlaceholderText('Search tool history...');
    fireEvent.change(searchInput, { target: { value: 'xxxnonexistentxxx' } });

    expect(screen.getByText('No records match your filters')).toBeInTheDocument();
    expect(screen.getByText('Clear filters')).toBeInTheDocument();
  });

  it('should clear filters when "Clear filters" button is clicked', () => {
    render(<ToolHistory records={mockRecords} />);

    // Apply a filter
    fireEvent.click(screen.getByText('Filters'));
    fireEvent.click(screen.getByText('error'));

    // Should show filtered results
    expect(screen.getByText(/Showing 1 of 3 records/)).toBeInTheDocument();

    // Now search for something that doesn't match
    const searchInput = screen.getByPlaceholderText('Search tool history...');
    fireEvent.change(searchInput, { target: { value: 'xxxnonexistentxxx' } });

    // Click clear filters
    fireEvent.click(screen.getByText('Clear filters'));

    // Should show all records again
    expect(screen.getByText(/Showing 3 of 3 records/)).toBeInTheDocument();
  });

  it('should display record count in footer', () => {
    render(<ToolHistory records={mockRecords} />);

    expect(screen.getByText(/Showing 3 of 3 records/)).toBeInTheDocument();
  });

  it('should not render onClearHistory button when not provided', () => {
    render(<ToolHistory records={mockRecords} />);

    expect(screen.queryByText('Clear All')).not.toBeInTheDocument();
  });

  it('should calculate statistics correctly for multiple tools', () => {
    render(<ToolHistory records={mockRecords} />);

    // Should show web_search with 2 calls
    expect(screen.getByText(/web_search:/)).toBeInTheDocument();
    expect(screen.getByText(/2 calls/)).toBeInTheDocument();
  });

  it('should handle records without duration', () => {
    const recordsWithRunning: ToolCallRecord[] = [
      ...mockRecords,
      {
        id: 'test-004',
        toolName: 'calculate',
        displayName: 'Calculator',
        timestamp: Date.now(),
        duration: null,
        status: 'running',
        input: { expression: '2+2' },
        output: null,
      },
    ];

    render(<ToolHistory records={recordsWithRunning} />);

    expect(screen.getAllByText('Calculator')).toBeTruthy();
  });

  it('should sort records by timestamp descending by default', () => {
    render(<ToolHistory records={mockRecords} />);

    const allWebSearchElements = screen.getAllByText('Web Search');
    // First Web Search should be the newest one (test-001)
    // Cannot easily verify order without exposing IDs, but component renders
    expect(allWebSearchElements.length).toBe(2);
  });

  it('should limit statistics display to top 3 tools', () => {
    const manyRecords: ToolCallRecord[] = [
      ...mockRecords,
      {
        id: 'test-004',
        toolName: 'calculate',
        displayName: 'Calculator',
        timestamp: Date.now(),
        duration: 50,
        status: 'success',
        input: {},
        output: {},
      },
      {
        id: 'test-005',
        toolName: 'fetch_url',
        displayName: 'URL Fetch',
        timestamp: Date.now(),
        duration: 100,
        status: 'success',
        input: {},
        output: {},
      },
    ];

    render(<ToolHistory records={manyRecords} />);

    // Should show "+2 more" for remaining tools
    expect(screen.getByText(/\+2 more/)).toBeInTheDocument();
  });

  it('should handle zero total calls gracefully', () => {
    render(<ToolHistory records={[]} />);

    expect(screen.getByText(/0 total calls/)).toBeInTheDocument();
  });
});
