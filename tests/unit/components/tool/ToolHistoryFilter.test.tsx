/**
 * ToolHistoryFilter Component Unit Tests (v3.7.0 Phase 3)
 * Tests filter and search functionality for tool history
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ToolHistoryFilter } from '../../../../src/renderer/components/tool/ToolHistoryFilter';
import type { ToolHistoryFilter as FilterType } from '../../../../src/shared/types/tool-history.types';

describe('ToolHistoryFilter', () => {
  const mockOnFilterChange = jest.fn();
  const availableTools = ['web_search', 'read_file', 'calculate', 'get_system_info'];

  const defaultProps = {
    filter: {},
    onFilterChange: mockOnFilterChange,
    availableTools,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render search input', () => {
    render(<ToolHistoryFilter {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search tool history...')).toBeInTheDocument();
  });

  it('should call onFilterChange when search query is entered', () => {
    render(<ToolHistoryFilter {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search tool history...');
    fireEvent.change(searchInput, { target: { value: 'test query' } });

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      searchQuery: 'test query',
    });
  });

  it('should clear search query when X button is clicked', () => {
    const filter: FilterType = { searchQuery: 'test' };
    render(<ToolHistoryFilter {...defaultProps} filter={filter} />);

    const clearButton = screen.getByRole('button', { name: '' });
    fireEvent.click(clearButton);

    expect(mockOnFilterChange).toHaveBeenCalledWith({ searchQuery: undefined });
  });

  it('should show filter section when Filters button is clicked', () => {
    render(<ToolHistoryFilter {...defaultProps} />);

    const filtersButton = screen.getByText('Filters');
    fireEvent.click(filtersButton);

    expect(screen.getByText('Tools')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('should display active filter count', () => {
    const filter: FilterType = {
      toolNames: ['web_search', 'read_file'],
      status: ['success'],
    };
    render(<ToolHistoryFilter {...defaultProps} filter={filter} />);

    expect(screen.getByText('3')).toBeInTheDocument(); // 2 tools + 1 status
  });

  it('should toggle tool filter when tool button is clicked', () => {
    render(<ToolHistoryFilter {...defaultProps} />);

    // Expand filters
    fireEvent.click(screen.getByText('Filters'));

    // Click on Web Search tool
    const webSearchButton = screen.getByText(/Web Search/);
    fireEvent.click(webSearchButton);

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      toolNames: ['web_search'],
    });
  });

  it('should toggle multiple tools', () => {
    const filter: FilterType = { toolNames: ['web_search'] };
    render(<ToolHistoryFilter {...defaultProps} filter={filter} />);

    // Expand filters
    fireEvent.click(screen.getByText('Filters'));

    // Click on Read File tool
    const readFileButton = screen.getByText(/Read File/);
    fireEvent.click(readFileButton);

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      toolNames: ['web_search', 'read_file'],
    });
  });

  it('should remove tool filter when already selected tool is clicked', () => {
    const filter: FilterType = { toolNames: ['web_search', 'read_file'] };
    render(<ToolHistoryFilter {...defaultProps} filter={filter} />);

    // Expand filters
    fireEvent.click(screen.getByText('Filters'));

    // Click on Web Search to deselect
    const webSearchButton = screen.getByText(/Web Search/);
    fireEvent.click(webSearchButton);

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      toolNames: ['read_file'],
    });
  });

  it('should toggle status filter when status button is clicked', () => {
    render(<ToolHistoryFilter {...defaultProps} />);

    // Expand filters
    fireEvent.click(screen.getByText('Filters'));

    // Click on success status
    const successButton = screen.getByText('success');
    fireEvent.click(successButton);

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      status: ['success'],
    });
  });

  it('should toggle multiple statuses', () => {
    const filter: FilterType = { status: ['success'] };
    render(<ToolHistoryFilter {...defaultProps} filter={filter} />);

    // Expand filters
    fireEvent.click(screen.getByText('Filters'));

    // Click on error status
    const errorButton = screen.getByText('error');
    fireEvent.click(errorButton);

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      status: ['success', 'error'],
    });
  });

  it('should update date from filter', () => {
    render(<ToolHistoryFilter {...defaultProps} />);

    // Expand filters
    fireEvent.click(screen.getByText('Filters'));

    // Select date from
    const dateFromInput = screen.getByLabelText('From');
    fireEvent.change(dateFromInput, { target: { value: '2025-01-01' } });

    expect(mockOnFilterChange).toHaveBeenCalled();
  });

  it('should update date to filter', () => {
    render(<ToolHistoryFilter {...defaultProps} />);

    // Expand filters
    fireEvent.click(screen.getByText('Filters'));

    // Select date to
    const dateToInput = screen.getByLabelText('To');
    fireEvent.change(dateToInput, { target: { value: '2025-01-31' } });

    expect(mockOnFilterChange).toHaveBeenCalled();
  });

  it('should clear all filters when "Clear all" is clicked', () => {
    const filter: FilterType = {
      toolNames: ['web_search'],
      status: ['success'],
      searchQuery: 'test',
      dateFrom: Date.now(),
    };
    render(<ToolHistoryFilter {...defaultProps} filter={filter} />);

    const clearAllButton = screen.getByText('Clear all');
    fireEvent.click(clearAllButton);

    expect(mockOnFilterChange).toHaveBeenCalledWith({});
  });

  it('should not show "Clear all" button when no filters are active', () => {
    render(<ToolHistoryFilter {...defaultProps} />);

    expect(screen.queryByText('Clear all')).not.toBeInTheDocument();
  });

  it('should show selected tools with blue background', () => {
    const filter: FilterType = { toolNames: ['web_search'] };
    render(<ToolHistoryFilter {...defaultProps} filter={filter} />);

    // Expand filters
    fireEvent.click(screen.getByText('Filters'));

    const webSearchButton = screen.getByText(/Web Search/);
    expect(webSearchButton).toHaveClass('bg-blue-600');
  });

  it('should show selected statuses with blue background', () => {
    const filter: FilterType = { status: ['success'] };
    render(<ToolHistoryFilter {...defaultProps} filter={filter} />);

    // Expand filters
    fireEvent.click(screen.getByText('Filters'));

    const successButton = screen.getByText('success');
    expect(successButton).toHaveClass('bg-blue-600');
  });

  it('should collapse filter section when clicked again', () => {
    render(<ToolHistoryFilter {...defaultProps} />);

    // Expand
    fireEvent.click(screen.getByText('Filters'));
    expect(screen.getByText('Tools')).toBeInTheDocument();

    // Collapse
    fireEvent.click(screen.getByText('Filters'));
    expect(screen.queryByText('Tools')).not.toBeInTheDocument();
  });

  it('should handle empty available tools list', () => {
    render(<ToolHistoryFilter {...defaultProps} availableTools={[]} />);

    // Expand filters
    fireEvent.click(screen.getByText('Filters'));

    // Should not crash
    expect(screen.getByText('Tools')).toBeInTheDocument();
  });

  it('should preserve search input value', () => {
    const filter: FilterType = { searchQuery: 'my search' };
    render(<ToolHistoryFilter {...defaultProps} filter={filter} />);

    const searchInput = screen.getByPlaceholderText('Search tool history...') as HTMLInputElement;
    expect(searchInput.value).toBe('my search');
  });

  it('should display date range filter section', () => {
    render(<ToolHistoryFilter {...defaultProps} />);

    // Expand filters
    fireEvent.click(screen.getByText('Filters'));

    expect(screen.getByText('Date Range')).toBeInTheDocument();
    expect(screen.getByLabelText('From')).toBeInTheDocument();
    expect(screen.getByLabelText('To')).toBeInTheDocument();
  });
});
