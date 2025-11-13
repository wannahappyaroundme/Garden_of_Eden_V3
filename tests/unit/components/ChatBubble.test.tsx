/**
 * ChatBubble Component Unit Tests
 * Tests feedback buttons and UI interactions
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatBubble } from '../../../src/renderer/components/chat/ChatBubble';

describe('ChatBubble', () => {
  const defaultProps = {
    message: 'Test message',
    messageId: 'msg-1',
    role: 'assistant' as const,
    timestamp: new Date('2025-01-12T10:00:00'),
  };

  it('should render user message correctly', () => {
    render(<ChatBubble {...defaultProps} role="user" />);

    expect(screen.getByText('Test message')).toBeInTheDocument();
    expect(screen.getByLabelText(/사용자 메시지/)).toBeInTheDocument();
  });

  it('should render AI message correctly', () => {
    render(<ChatBubble {...defaultProps} role="assistant" />);

    expect(screen.getByText(/Test message/)).toBeInTheDocument();
    expect(screen.getByLabelText(/AI 메시지/)).toBeInTheDocument();
  });

  it('should format timestamp correctly', () => {
    render(<ChatBubble {...defaultProps} />);

    const timestamp = screen.getByLabelText(/전송 시간: 10:00/);
    expect(timestamp).toBeInTheDocument();
  });

  it('should show feedback buttons for AI messages on hover', () => {
    const onFeedback = jest.fn();

    const { container } = render(
      <ChatBubble {...defaultProps} onFeedback={onFeedback} />
    );

    // Feedback buttons should be in the document
    const likeButton = screen.getByLabelText('좋아요');
    const dislikeButton = screen.getByLabelText('별로에요');

    expect(likeButton).toBeInTheDocument();
    expect(dislikeButton).toBeInTheDocument();
  });

  it('should not show feedback buttons for user messages', () => {
    const onFeedback = jest.fn();

    render(<ChatBubble {...defaultProps} role="user" onFeedback={onFeedback} />);

    expect(screen.queryByLabelText('좋아요')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('별로에요')).not.toBeInTheDocument();
  });

  it('should call onFeedback when thumbs up clicked', () => {
    const onFeedback = jest.fn();

    render(<ChatBubble {...defaultProps} onFeedback={onFeedback} />);

    const likeButton = screen.getByLabelText('좋아요');
    fireEvent.click(likeButton);

    expect(onFeedback).toHaveBeenCalledWith('msg-1', 'positive');
  });

  it('should call onFeedback when thumbs down clicked', () => {
    const onFeedback = jest.fn();

    render(<ChatBubble {...defaultProps} onFeedback={onFeedback} />);

    const dislikeButton = screen.getByLabelText('별로에요');
    fireEvent.click(dislikeButton);

    expect(onFeedback).toHaveBeenCalledWith('msg-1', 'negative');
  });

  it('should highlight selected feedback', () => {
    render(<ChatBubble {...defaultProps} satisfaction="positive" />);

    const likeButton = screen.getByLabelText('좋아요');
    const svg = likeButton.querySelector('svg');

    // Check if fill is 'currentColor' (filled state)
    expect(svg).toHaveAttribute('fill', 'currentColor');
  });

  it('should show copy button for AI messages', () => {
    render(<ChatBubble {...defaultProps} />);

    const copyButton = screen.getByLabelText(/메시지 복사/);
    expect(copyButton).toBeInTheDocument();
  });

  it('should copy message to clipboard', async () => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });

    render(<ChatBubble {...defaultProps} />);

    const copyButton = screen.getByLabelText(/메시지 복사/);
    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Test message');
  });

  it('should show streaming indicator when streaming', () => {
    render(<ChatBubble {...defaultProps} message="" isStreaming />);

    expect(screen.getByText('...')).toBeInTheDocument();
  });

  it('should apply animation classes based on role', () => {
    const { container, rerender } = render(<ChatBubble {...defaultProps} role="user" />);

    expect(container.firstChild).toHaveClass('justify-end', 'animate-slide-in-right');

    rerender(<ChatBubble {...defaultProps} role="assistant" />);

    expect(container.firstChild).toHaveClass('justify-start', 'animate-slide-in-left');
  });

  it('should not show feedback buttons when messageId is missing', () => {
    const onFeedback = jest.fn();

    render(<ChatBubble {...defaultProps} messageId={undefined} onFeedback={onFeedback} />);

    expect(screen.queryByLabelText('좋아요')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('별로에요')).not.toBeInTheDocument();
  });
});
