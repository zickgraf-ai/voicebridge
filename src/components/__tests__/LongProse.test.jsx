import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LongProse, { splitParagraphs, MAX_PROSE_CHARS, MAX_PROSE_PARAGRAPHS, MAX_SAVED_PROSE } from '../LongProse';

// Mock storage utilities
vi.mock('../../utils/storage', () => ({
  loadState: vi.fn(() => []),
  saveState: vi.fn(),
}));

import { loadState, saveState } from '../../utils/storage';

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
    loadState.mockReturnValue([]);
    saveState.mockClear();
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

  it('exports expected limit constants', () => {
    expect(MAX_PROSE_CHARS).toBe(2000);
    expect(MAX_PROSE_PARAGRAPHS).toBe(10);
    expect(MAX_SAVED_PROSE).toBe(5);
  });

  it('truncates input at MAX_PROSE_CHARS', async () => {
    const user = userEvent.setup();
    render(<LongProse onSpeakParagraph={onSpeakParagraph} onStop={onStop} />);

    const textarea = screen.getByLabelText('Long prose input');
    // Type exactly at the limit
    const longText = 'A'.repeat(MAX_PROSE_CHARS + 50);
    await user.click(textarea);
    // Use fireEvent for performance on large input
    const { fireEvent } = await import('@testing-library/react');
    fireEvent.change(textarea, { target: { value: longText } });

    expect(textarea.value.length).toBe(MAX_PROSE_CHARS);
  });

  it('shows chars remaining when text is entered', async () => {
    const user = userEvent.setup();
    render(<LongProse onSpeakParagraph={onSpeakParagraph} onStop={onStop} />);

    await user.type(screen.getByLabelText('Long prose input'), 'Hello');

    expect(screen.getByText(`${MAX_PROSE_CHARS - 5} chars left`)).toBeInTheDocument();
  });

  it('disables speak when too many paragraphs', async () => {
    render(<LongProse onSpeakParagraph={onSpeakParagraph} onStop={onStop} />);

    const textarea = screen.getByLabelText('Long prose input');
    // Create MAX_PROSE_PARAGRAPHS + 1 paragraphs
    const manyParagraphs = Array.from({ length: MAX_PROSE_PARAGRAPHS + 1 }, (_, i) => `P${i + 1}`).join('\n\n');
    const { fireEvent } = await import('@testing-library/react');
    fireEvent.change(textarea, { target: { value: manyParagraphs } });

    expect(screen.getByText(/too many/)).toBeInTheDocument();
    expect(screen.getByLabelText('Speak all paragraphs')).toBeDisabled();
  });

  it('enables speak when paragraph count is at the limit', async () => {
    render(<LongProse onSpeakParagraph={onSpeakParagraph} onStop={onStop} />);

    const textarea = screen.getByLabelText('Long prose input');
    // Create exactly MAX_PROSE_PARAGRAPHS paragraphs
    const paragraphs = Array.from({ length: MAX_PROSE_PARAGRAPHS }, (_, i) => `P${i + 1}`).join('\n\n');
    const { fireEvent } = await import('@testing-library/react');
    fireEvent.change(textarea, { target: { value: paragraphs } });

    expect(screen.getByLabelText('Speak all paragraphs')).not.toBeDisabled();
  });

  it('shows device voice note when isPremium is true', () => {
    render(<LongProse onSpeakParagraph={onSpeakParagraph} onStop={onStop} isPremium={true} />);

    expect(screen.getByText('Prose uses device voice to keep costs down')).toBeInTheDocument();
  });

  it('hides device voice note when isPremium is false', () => {
    render(<LongProse onSpeakParagraph={onSpeakParagraph} onStop={onStop} isPremium={false} />);

    expect(screen.queryByText('Prose uses device voice to keep costs down')).not.toBeInTheDocument();
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

describe('Saved prose', () => {
  let onSpeakParagraph;
  let onStop;

  beforeEach(() => {
    onSpeakParagraph = vi.fn();
    onStop = vi.fn();
    loadState.mockReturnValue([]);
    saveState.mockClear();
  });

  it('shows save button when text is entered', async () => {
    const user = userEvent.setup();
    render(<LongProse onSpeakParagraph={onSpeakParagraph} onStop={onStop} />);

    await user.type(screen.getByLabelText('Long prose input'), 'Hello world');

    expect(screen.getByLabelText('Save prose')).toBeInTheDocument();
  });

  it('hides save button when no text', () => {
    render(<LongProse onSpeakParagraph={onSpeakParagraph} onStop={onStop} />);

    expect(screen.queryByLabelText('Save prose')).not.toBeInTheDocument();
  });

  it('enters save mode with title input when save is clicked', async () => {
    const user = userEvent.setup();
    render(<LongProse onSpeakParagraph={onSpeakParagraph} onStop={onStop} />);

    await user.type(screen.getByLabelText('Long prose input'), 'Hello world');
    await user.click(screen.getByLabelText('Save prose'));

    expect(screen.getByLabelText('Prose title')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Title for this prose...')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm save')).toBeInTheDocument();
    expect(screen.getByLabelText('Cancel save')).toBeInTheDocument();
  });

  it('saves prose entry when title is confirmed', async () => {
    const user = userEvent.setup();
    render(<LongProse onSpeakParagraph={onSpeakParagraph} onStop={onStop} />);

    await user.type(screen.getByLabelText('Long prose input'), 'My explanation text');
    await user.click(screen.getByLabelText('Save prose'));
    await user.type(screen.getByLabelText('Prose title'), 'Surgery Explanation');
    await user.click(screen.getByLabelText('Confirm save'));

    // Entry should appear in the saved list
    expect(screen.getByText('Surgery Explanation')).toBeInTheDocument();
    expect(screen.getByLabelText('Play Surgery Explanation')).toBeInTheDocument();
    expect(screen.getByLabelText('Delete Surgery Explanation')).toBeInTheDocument();
    // Textarea should be cleared after save
    expect(screen.getByLabelText('Long prose input')).toHaveValue('');
    // Should persist to localStorage
    expect(saveState).toHaveBeenCalledWith('savedProse', expect.arrayContaining([
      expect.objectContaining({ title: 'Surgery Explanation', text: 'My explanation text' }),
    ]));
  });

  it('saves prose with Enter key in title input', async () => {
    const user = userEvent.setup();
    render(<LongProse onSpeakParagraph={onSpeakParagraph} onStop={onStop} />);

    await user.type(screen.getByLabelText('Long prose input'), 'Some text');
    await user.click(screen.getByLabelText('Save prose'));
    await user.type(screen.getByLabelText('Prose title'), 'Quick Title{Enter}');

    expect(screen.getByText('Quick Title')).toBeInTheDocument();
  });

  it('cancels save mode when cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<LongProse onSpeakParagraph={onSpeakParagraph} onStop={onStop} />);

    await user.type(screen.getByLabelText('Long prose input'), 'Hello world');
    await user.click(screen.getByLabelText('Save prose'));
    await user.click(screen.getByLabelText('Cancel save'));

    // Should exit save mode, text still present
    expect(screen.queryByLabelText('Prose title')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Long prose input')).toHaveValue('Hello world');
  });

  it('cancels save mode with Escape key', async () => {
    const user = userEvent.setup();
    render(<LongProse onSpeakParagraph={onSpeakParagraph} onStop={onStop} />);

    await user.type(screen.getByLabelText('Long prose input'), 'Hello world');
    await user.click(screen.getByLabelText('Save prose'));
    await user.keyboard('{Escape}');

    expect(screen.queryByLabelText('Prose title')).not.toBeInTheDocument();
  });

  it('disables confirm when title is empty', async () => {
    const user = userEvent.setup();
    render(<LongProse onSpeakParagraph={onSpeakParagraph} onStop={onStop} />);

    await user.type(screen.getByLabelText('Long prose input'), 'Hello world');
    await user.click(screen.getByLabelText('Save prose'));

    expect(screen.getByLabelText('Confirm save')).toBeDisabled();
  });

  it('loads saved prose from localStorage on mount', () => {
    loadState.mockReturnValue([
      { id: '1', title: 'My Saved Entry', text: 'Hello world' },
    ]);

    render(<LongProse onSpeakParagraph={onSpeakParagraph} onStop={onStop} />);

    expect(screen.getByText('My Saved Entry')).toBeInTheDocument();
    expect(screen.getByLabelText('Play My Saved Entry')).toBeInTheDocument();
  });

  it('deletes saved prose entry', async () => {
    loadState.mockReturnValue([
      { id: '1', title: 'Entry One', text: 'Text one' },
      { id: '2', title: 'Entry Two', text: 'Text two' },
    ]);

    const user = userEvent.setup();
    render(<LongProse onSpeakParagraph={onSpeakParagraph} onStop={onStop} />);

    await user.click(screen.getByLabelText('Delete Entry One'));

    expect(screen.queryByText('Entry One')).not.toBeInTheDocument();
    expect(screen.getByText('Entry Two')).toBeInTheDocument();
  });

  it('plays saved prose entry', async () => {
    loadState.mockReturnValue([
      { id: '1', title: 'My Entry', text: 'First paragraph\n\nSecond paragraph' },
    ]);

    const user = userEvent.setup();
    render(<LongProse onSpeakParagraph={onSpeakParagraph} onStop={onStop} />);

    await user.click(screen.getByLabelText('Play My Entry'));

    expect(onSpeakParagraph).toHaveBeenCalledWith('First paragraph', expect.any(Function));
    expect(screen.getByText(/Playing: My Entry/)).toBeInTheDocument();
  });

  it('hides save button when 5 entries already saved', async () => {
    loadState.mockReturnValue(
      Array.from({ length: MAX_SAVED_PROSE }, (_, i) => ({
        id: String(i),
        title: `Entry ${i}`,
        text: `Text ${i}`,
      }))
    );

    const user = userEvent.setup();
    render(<LongProse onSpeakParagraph={onSpeakParagraph} onStop={onStop} />);

    await user.type(screen.getByLabelText('Long prose input'), 'New text');

    expect(screen.queryByLabelText('Save prose')).not.toBeInTheDocument();
  });

  it('shows saved count in status when entries exist but no text typed', () => {
    loadState.mockReturnValue([
      { id: '1', title: 'Entry One', text: 'Text one' },
      { id: '2', title: 'Entry Two', text: 'Text two' },
    ]);

    render(<LongProse onSpeakParagraph={onSpeakParagraph} onStop={onStop} />);

    expect(screen.getByText('2/5 saved')).toBeInTheDocument();
  });
});
