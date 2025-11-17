/**
 * ToolHistoryExport Component Unit Tests (v3.7.0 Phase 3)
 * Tests export functionality for tool history
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ToolHistoryExport } from '../../../../src/renderer/components/tool/ToolHistoryExport';
import type { ToolCallRecord } from '../../../../src/shared/types/tool-history.types';

describe('ToolHistoryExport', () => {
  const mockOnExport = jest.fn();

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
      status: 'error',
      input: { path: '/test.txt' },
      output: null,
      error: { message: 'File not found' },
    },
  ];

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render export heading', () => {
    render(<ToolHistoryExport records={mockRecords} />);
    expect(screen.getByText('Export History')).toBeInTheDocument();
  });

  it('should render format selection buttons', () => {
    render(<ToolHistoryExport records={mockRecords} />);
    expect(screen.getByText('JSON')).toBeInTheDocument();
    expect(screen.getByText('CSV')).toBeInTheDocument();
  });

  it('should select JSON format by default', () => {
    render(<ToolHistoryExport records={mockRecords} />);
    const jsonButton = screen.getByText('JSON');
    expect(jsonButton).toHaveClass('bg-blue-600');
  });

  it('should toggle to CSV format when clicked', () => {
    render(<ToolHistoryExport records={mockRecords} />);

    const csvButton = screen.getByText('CSV');
    fireEvent.click(csvButton);

    expect(csvButton).toHaveClass('bg-blue-600');
  });

  it('should render export options checkboxes', () => {
    render(<ToolHistoryExport records={mockRecords} />);

    expect(screen.getByText('Input parameters')).toBeInTheDocument();
    expect(screen.getByText('Output results')).toBeInTheDocument();
    expect(screen.getByText('Error details')).toBeInTheDocument();
  });

  it('should have all options checked by default', () => {
    render(<ToolHistoryExport records={mockRecords} />);

    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach((checkbox) => {
      expect(checkbox).toBeChecked();
    });
  });

  it('should toggle include input option', () => {
    render(<ToolHistoryExport records={mockRecords} />);

    const inputCheckbox = screen.getByLabelText('Input parameters') as HTMLInputElement;
    fireEvent.click(inputCheckbox);

    expect(inputCheckbox).not.toBeChecked();
  });

  it('should toggle include output option', () => {
    render(<ToolHistoryExport records={mockRecords} />);

    const outputCheckbox = screen.getByLabelText('Output results') as HTMLInputElement;
    fireEvent.click(outputCheckbox);

    expect(outputCheckbox).not.toBeChecked();
  });

  it('should toggle include errors option', () => {
    render(<ToolHistoryExport records={mockRecords} />);

    const errorsCheckbox = screen.getByLabelText('Error details') as HTMLInputElement;
    fireEvent.click(errorsCheckbox);

    expect(errorsCheckbox).not.toBeChecked();
  });

  it('should display record count in summary', () => {
    render(<ToolHistoryExport records={mockRecords} />);
    expect(screen.getByText(/2/)).toBeInTheDocument();
    expect(screen.getByText(/records/)).toBeInTheDocument();
  });

  it('should display selected format in summary', () => {
    render(<ToolHistoryExport records={mockRecords} />);
    expect(screen.getByText(/JSON/)).toBeInTheDocument();
  });

  it('should call onExport when Export button is clicked', async () => {
    render(<ToolHistoryExport records={mockRecords} onExport={mockOnExport} />);

    const exportButton = screen.getByText(/Export/);
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockOnExport).toHaveBeenCalled();
    });
  });

  it('should pass correct export options to onExport', async () => {
    render(<ToolHistoryExport records={mockRecords} onExport={mockOnExport} />);

    // Change to CSV
    fireEvent.click(screen.getByText('CSV'));

    // Uncheck input
    fireEvent.click(screen.getByLabelText('Input parameters'));

    const exportButton = screen.getByText(/Export/);
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockOnExport).toHaveBeenCalledWith(
        expect.objectContaining({
          format: 'csv',
          includeInput: false,
          includeOutput: true,
          includeErrors: true,
        })
      );
    });
  });

  it('should disable export button when no records', () => {
    render(<ToolHistoryExport records={[]} />);

    const exportButton = screen.getByText(/Export/);
    expect(exportButton).toBeDisabled();
  });

  it('should show "No records to export" message when empty', () => {
    render(<ToolHistoryExport records={[]} />);
    expect(screen.getByText('No records to export')).toBeInTheDocument();
  });

  it('should show success message after export', async () => {
    mockOnExport.mockResolvedValue(undefined);
    render(<ToolHistoryExport records={mockRecords} onExport={mockOnExport} />);

    const exportButton = screen.getByText(/Export/);
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(screen.getByText('Exported Successfully')).toBeInTheDocument();
    });
  });

  it('should hide success message after 3 seconds', async () => {
    jest.useFakeTimers();
    mockOnExport.mockResolvedValue(undefined);
    render(<ToolHistoryExport records={mockRecords} onExport={mockOnExport} />);

    const exportButton = screen.getByText(/Export/);
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(screen.getByText('Exported Successfully')).toBeInTheDocument();
    });

    // Fast-forward time
    jest.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(screen.queryByText('Exported Successfully')).not.toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  it('should disable export button during export', async () => {
    let resolveExport: () => void;
    const exportPromise = new Promise<void>((resolve) => {
      resolveExport = resolve;
    });
    mockOnExport.mockReturnValue(exportPromise);

    render(<ToolHistoryExport records={mockRecords} onExport={mockOnExport} />);

    const exportButton = screen.getByText(/Export/);
    fireEvent.click(exportButton);

    expect(screen.getByText('Exporting...')).toBeInTheDocument();
    expect(exportButton).toBeDisabled();

    // Resolve the export
    resolveExport!();
  });

  it('should update summary when format changes', () => {
    render(<ToolHistoryExport records={mockRecords} />);

    expect(screen.getByText(/JSON/)).toBeInTheDocument();

    // Change to CSV
    fireEvent.click(screen.getByText('CSV'));

    expect(screen.getByText(/CSV/)).toBeInTheDocument();
  });

  it('should handle singular record count', () => {
    const singleRecord = [mockRecords[0]];
    render(<ToolHistoryExport records={singleRecord} />);

    expect(screen.getByText(/1 record/)).toBeInTheDocument();
  });

  it('should handle plural record count', () => {
    render(<ToolHistoryExport records={mockRecords} />);

    expect(screen.getByText(/2 records/)).toBeInTheDocument();
  });
});
