/**
 * ToolToggle Component Unit Tests (v3.7.0 Phase 2)
 * Tests tool enable/disable toggle functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ToolToggle } from '../../../../src/renderer/components/settings/ToolToggle';

describe('ToolToggle', () => {
  const mockOnToggle = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render tool name correctly', () => {
    render(
      <ToolToggle
        toolName="web_search"
        enabled={true}
        onToggle={mockOnToggle}
      />
    );

    expect(screen.getByText('Web Search')).toBeInTheDocument();
  });

  it('should show enabled status when enabled', () => {
    render(
      <ToolToggle
        toolName="web_search"
        enabled={true}
        onToggle={mockOnToggle}
      />
    );

    expect(screen.getByText('Enabled')).toBeInTheDocument();
  });

  it('should show disabled status when disabled', () => {
    render(
      <ToolToggle
        toolName="web_search"
        enabled={false}
        onToggle={mockOnToggle}
      />
    );

    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });

  it('should show permission badge when required', () => {
    render(
      <ToolToggle
        toolName="web_search"
        enabled={true}
        onToggle={mockOnToggle}
        requiresPermission={true}
      />
    );

    expect(screen.getByText('Requires Permission')).toBeInTheDocument();
  });

  it('should not show permission badge when not required', () => {
    render(
      <ToolToggle
        toolName="calculate"
        enabled={true}
        onToggle={mockOnToggle}
        requiresPermission={false}
      />
    );

    expect(screen.queryByText('Requires Permission')).not.toBeInTheDocument();
  });

  it('should call onToggle when toggle button is clicked', async () => {
    mockOnToggle.mockResolvedValue(undefined);

    render(
      <ToolToggle
        toolName="web_search"
        enabled={false}
        onToggle={mockOnToggle}
      />
    );

    const toggleButton = screen.getByLabelText('Toggle Web Search');
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(mockOnToggle).toHaveBeenCalledWith('web_search', true);
    });
  });

  it('should toggle from enabled to disabled', async () => {
    mockOnToggle.mockResolvedValue(undefined);

    render(
      <ToolToggle
        toolName="web_search"
        enabled={true}
        onToggle={mockOnToggle}
      />
    );

    const toggleButton = screen.getByLabelText('Toggle Web Search');
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(mockOnToggle).toHaveBeenCalledWith('web_search', false);
    });
  });

  it('should apply tool-specific colors when enabled', () => {
    const { container } = render(
      <ToolToggle
        toolName="web_search"
        enabled={true}
        onToggle={mockOnToggle}
      />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('border-blue-500/20', 'bg-blue-500/10');
  });

  it('should apply gray colors when disabled', () => {
    const { container } = render(
      <ToolToggle
        toolName="web_search"
        enabled={false}
        onToggle={mockOnToggle}
      />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('bg-gray-50');
  });

  it('should disable toggle button during toggle operation', async () => {
    const slowToggle = jest.fn(() => new Promise((resolve) => setTimeout(resolve, 100)));

    render(
      <ToolToggle
        toolName="web_search"
        enabled={false}
        onToggle={slowToggle}
      />
    );

    const toggleButton = screen.getByLabelText('Toggle Web Search');
    fireEvent.click(toggleButton);

    expect(toggleButton).toBeDisabled();

    await waitFor(() => {
      expect(toggleButton).not.toBeDisabled();
    });
  });
});
