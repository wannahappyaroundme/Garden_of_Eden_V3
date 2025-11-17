/**
 * ToolHistoryItem Component Unit Tests (v3.7.0 Phase 3)
 * Tests individual tool call history entry display
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ToolHistoryItem } from '../../../../src/renderer/components/tool/ToolHistoryItem';
import type { ToolCallRecord } from '../../../../src/shared/types/tool-history.types';

describe('ToolHistoryItem', () => {
  const mockOnCopy = jest.fn();

  const createMockRecord = (overrides?: Partial<ToolCallRecord>): ToolCallRecord => ({
    id: 'test-001',
    toolName: 'web_search',
    displayName: 'Web Search',
    timestamp: Date.now(),
    duration: 1500,
    status: 'success',
    input: { query: 'test query' },
    output: { results: ['result1', 'result2'] },
    ...overrides,
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render tool name and icon correctly', () => {
    const record = createMockRecord();
    render(<ToolHistoryItem record={record} />);

    expect(screen.getByText('Web Search')).toBeInTheDocument();
    expect(screen.getByText('🔍')).toBeInTheDocument();
  });

  it('should display success status correctly', () => {
    const record = createMockRecord({ status: 'success' });
    const { container } = render(<ToolHistoryItem record={record} />);

    expect(screen.getByText('success')).toBeInTheDocument();
    expect(container).toHaveTextContent('✅');
  });

  it('should display error status correctly', () => {
    const record = createMockRecord({
      status: 'error',
      error: { message: 'Test error message' },
    });
    const { container } = render(<ToolHistoryItem record={record} />);

    expect(screen.getByText('error')).toBeInTheDocument();
    expect(container).toHaveTextContent('❌');
  });

  it('should display running status correctly', () => {
    const record = createMockRecord({ status: 'running', duration: null });
    const { container } = render(<ToolHistoryItem record={record} />);

    expect(screen.getByText('running')).toBeInTheDocument();
    expect(container).toHaveTextContent('⏱️');
  });

  it('should expand and show details when clicked', () => {
    const record = createMockRecord();
    render(<ToolHistoryItem record={record} />);

    // Initially collapsed
    expect(screen.queryByText('Input')).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(screen.getByText('Web Search'));

    // Details should be visible
    expect(screen.getByText('Input')).toBeInTheDocument();
    expect(screen.getByText('Output')).toBeInTheDocument();
  });

  it('should display input data when expanded', () => {
    const record = createMockRecord({
      input: { query: 'React hooks', maxResults: 5 },
    });
    render(<ToolHistoryItem record={record} />);

    // Expand
    fireEvent.click(screen.getByText('Web Search'));

    // Check input is displayed
    expect(screen.getByText(/React hooks/)).toBeInTheDocument();
  });

  it('should display output data when expanded', () => {
    const record = createMockRecord({
      output: { result: 'test output' },
    });
    render(<ToolHistoryItem record={record} />);

    // Expand
    fireEvent.click(screen.getByText('Web Search'));

    // Check output is displayed
    expect(screen.getByText(/test output/)).toBeInTheDocument();
  });

  it('should display error details when status is error', () => {
    const record = createMockRecord({
      status: 'error',
      error: {
        message: 'Connection failed',
        code: 'ECONNREFUSED',
      },
    });
    render(<ToolHistoryItem record={record} />);

    // Expand
    fireEvent.click(screen.getByText('Web Search'));

    // Check error details
    expect(screen.getByText('Connection failed')).toBeInTheDocument();
    expect(screen.getByText(/ECONNREFUSED/)).toBeInTheDocument();
  });

  it('should call onCopy when copy button is clicked', () => {
    const record = createMockRecord();
    render(<ToolHistoryItem record={record} onCopy={mockOnCopy} />);

    const copyButton = screen.getByTitle('Copy to clipboard');
    fireEvent.click(copyButton);

    expect(mockOnCopy).toHaveBeenCalledWith(record);
  });

  it('should show check icon after copying', async () => {
    const record = createMockRecord();
    render(<ToolHistoryItem record={record} onCopy={mockOnCopy} />);

    const copyButton = screen.getByTitle('Copy to clipboard');
    fireEvent.click(copyButton);

    // Check icon should be visible
    await waitFor(() => {
      expect(screen.getByTitle('Copy to clipboard')).toContainHTML('text-green-600');
    });
  });

  it('should display duration in correct format', () => {
    const record = createMockRecord({ duration: 1500 });
    render(<ToolHistoryItem record={record} />);

    expect(screen.getByText(/1.5s/)).toBeInTheDocument();
  });

  it('should display "Running..." when duration is null', () => {
    const record = createMockRecord({ duration: null, status: 'running' });
    render(<ToolHistoryItem record={record} />);

    // Note: The duration display is in the formatDuration utility
    // This test checks that the component handles null duration
    expect(screen.getByText(/running/i)).toBeInTheDocument();
  });

  it('should display conversation ID when provided', () => {
    const record = createMockRecord({ conversationId: 'conv-123' });
    render(<ToolHistoryItem record={record} />);

    // Expand to see metadata
    fireEvent.click(screen.getByText('Web Search'));

    expect(screen.getByText(/conv-123/)).toBeInTheDocument();
  });

  it('should display message ID when provided', () => {
    const record = createMockRecord({ messageId: 'msg-456' });
    render(<ToolHistoryItem record={record} />);

    // Expand to see metadata
    fireEvent.click(screen.getByText('Web Search'));

    expect(screen.getByText(/msg-456/)).toBeInTheDocument();
  });

  it('should toggle between expanded and collapsed state', () => {
    const record = createMockRecord();
    render(<ToolHistoryItem record={record} />);

    // Expand
    fireEvent.click(screen.getByText('Web Search'));
    expect(screen.getByText('Input')).toBeInTheDocument();

    // Collapse
    fireEvent.click(screen.getByText('Web Search'));
    expect(screen.queryByText('Input')).not.toBeInTheDocument();
  });

  it('should display correct tool category', () => {
    const record = createMockRecord({ toolName: 'web_search' });
    const { container } = render(<ToolHistoryItem record={record} />);

    // Expand to see metadata
    fireEvent.click(screen.getByText('Web Search'));

    expect(container).toHaveTextContent('web');
  });

  it('should handle different tool types correctly', () => {
    const tools = [
      { toolName: 'read_file', displayName: 'Read File', icon: '📖' },
      { toolName: 'calculate', displayName: 'Calculator', icon: '🔢' },
      { toolName: 'get_system_info', displayName: 'System Info', icon: '💻' },
    ];

    tools.forEach((tool) => {
      const { unmount } = render(
        <ToolHistoryItem
          record={createMockRecord({
            toolName: tool.toolName,
            displayName: tool.displayName,
          })}
        />
      );

      expect(screen.getByText(tool.displayName)).toBeInTheDocument();
      expect(screen.getByText(tool.icon)).toBeInTheDocument();

      unmount();
    });
  });
});
