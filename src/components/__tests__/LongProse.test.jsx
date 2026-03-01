import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LongProse, { splitParagraphs } from '../LongProse';

describe('splitParagraphs', () => {
  it('splits on double newlines', () => {
    expect(splitParagraphs('Hello\n\nWorld')).toEqual(['Hello', 'World']);
  });

  it('handles multiple paragraphs', () => {
    expect(splitParagraphs('A\n\nB\n\nC')).toEqual(['A', 'B', 'C']);
  });

  it('filters out empty segments', () => {
    expect(splitParagraphs('\n\nHello\n\n\n\nWorld\n\n')).toEqual(['Hello', 'World']);
  });

  it('treats single newlines as same paragraph', () => {
    expect(splitParagraphs('Hello\nWorld')).toEqual(['Hello\nWorld']);
  });

  it('returns empty array for empty string', () => {
    expect(splitParagraphs('')).toEqual([]);
  });

  it('returns empty array for whitespace-only', () => {
    expect(splitParagraphs('   \n\n   ')).toEqual([]);
  });

  it('trims whitespace from paragraphs', () => {
    expect(splitParagraphs('  Hello  \n\n  World  ')).toEqual(['Hello', 'World']);
  });
});

describe('LongProse', () => {
  let onSpeakParagraph;
  let onStop;

  beforeEach(() => {
    onSpeakParagraph = vi.fn();
    onStop = vi.fn();
  });

  it('renders textarea and controls', () => {
    render(<LongProse onSpeakParagraph={onSpeakParagraph} onStop={onStop} />);

    expect(screen.getByLabelText('Long prose input')).toBeInTheDocument();
    expect(screen.getByLabelText('Speak all paragraphs')).toBeInTheDocument();
    expect(screen.getByLabelText('Clear text')).toBeInTheDocument();
    expect(screen.getByText('No text yet')).toBeInTheDocument();
  });

  it('shows paragraph count when text is entered', async () => {
    const user = userEvent.setup();
    render(<LongProse onSpeakParagraph={onSpeakParagraph} onStop={onStop} />);

    await user.type(screen.getByLabelText('Long prose input'), 'Hello world');

    expect(screen.getByText('1 paragraph')).toBeInTheDocument();
  });

  it('shows plural paragraph count for multiple paragraphs', async () => {
    const user = userEvent.setup();
    render(<LongProse onSpeakParagraph={onSpeakParagraph} onStop={onStop} />);

    // Type text with paragraph break (double newline)
    const textarea = screen.getByLabelText('Long prose input');
    await user.type(textarea, 'First paragraph');
    // Simulate entering double newline
    await user.clear(textarea);
    await user.type(textarea, 'First\n\nSecond');

    expect(screen.getByText('2 paragraphs')).toBeInTheDocument();
  });

  it('disables speak button when no text', () => {
    render(<LongProse onSpeakParagraph={onSpeakParagraph} onStop={onStop} />);

    const speakBtn = screen.getByLabelText('Speak all paragraphs');
    expect(speakBtn).toBeDisabled();
  });

  it('enables speak button when text is present', async () => {
    const user = userEvent.setup();
    render(<LongProse onSpeakParagraph={onSpeakParagraph} onStop={onStop} />);

    await user.type(screen.getByLabelText('Long prose input'), 'Hello');

    expect(screen.getByLabelText('Speak all paragraphs')).not.toBeDisabled();
  });

  it('calls onSpeakParagraph when speak is clicked', async () => {
    const user = userEvent.setup();
    render(<LongProse onSpeakParagraph={onSpeakParagraph} onStop={onStop} />);

    await user.type(screen.getByLabelText('Long prose input'), 'Hello world');
    await user.click(screen.getByLabelText('Speak all paragraphs'));

    expect(onSpeakParagraph).toHaveBeenCalledWith('Hello world', expect.any(Function));
  });

  it('shows stop button and progress while speaking', async () => {
    const user = userEvent.setup();
    render(<LongProse onSpeakParagraph={onSpeakParagraph} onStop={onStop} />);

    await user.type(screen.getByLabelText('Long prose input'), 'Hello world');
    await user.click(screen.getByLabelText('Speak all paragraphs'));

    expect(screen.getByLabelText('Stop speaking')).toBeInTheDocument();
    expect(screen.getByText(/Speaking paragraph 1 of 1/)).toBeInTheDocument();
  });

  it('calls onStop when stop button is clicked', async () => {
    const user = userEvent.setup();
    render(<LongProse onSpeakParagraph={onSpeakParagraph} onStop={onStop} />);

    await user.type(screen.getByLabelText('Long prose input'), 'Hello world');
    await user.click(screen.getByLabelText('Speak all paragraphs'));
    await user.click(screen.getByLabelText('Stop speaking'));

    expect(onStop).toHaveBeenCalled();
  });

  it('clears text when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(<LongProse onSpeakParagraph={onSpeakParagraph} onStop={onStop} />);

    const textarea = screen.getByLabelText('Long prose input');
    await user.type(textarea, 'Hello');
    await user.click(screen.getByLabelText('Clear text'));

    expect(textarea).toHaveValue('');
    expect(screen.getByText('No text yet')).toBeInTheDocument();
  });

  it('disables textarea while speaking', async () => {
    const user = userEvent.setup();
    render(<LongProse onSpeakParagraph={onSpeakParagraph} onStop={onStop} />);

    await user.type(screen.getByLabelText('Long prose input'), 'Hello');
    await user.click(screen.getByLabelText('Speak all paragraphs'));

    expect(screen.getByLabelText('Long prose input')).toBeDisabled();
  });

  it('speaks multiple paragraphs sequentially', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    // onSpeakParagraph immediately calls the done callback
    onSpeakParagraph.mockImplementation((text, onDone) => {
      setTimeout(onDone, 100);
    });

    render(<LongProse onSpeakParagraph={onSpeakParagraph} onStop={onStop} />);

    const textarea = screen.getByLabelText('Long prose input');
    await user.clear(textarea);
    await user.type(textarea, 'First paragraph\n\nSecond paragraph');
    await user.click(screen.getByLabelText('Speak all paragraphs'));

    // First paragraph should be spoken immediately
    expect(onSpeakParagraph).toHaveBeenCalledWith('First paragraph', expect.any(Function));
    expect(screen.getByText(/Speaking paragraph 1 of 2/)).toBeInTheDocument();

    // Advance past the first paragraph's done callback
    vi.advanceTimersByTime(200);

    // Advance past the 800ms inter-paragraph pause
    vi.advanceTimersByTime(900);

    // Second paragraph should now be spoken
    expect(onSpeakParagraph).toHaveBeenCalledWith('Second paragraph', expect.any(Function));

    vi.useRealTimers();
  });
});
