import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SpeechBar from '../SpeechBar';

function renderSpeechBar(overrides = {}) {
  const props = {
    text: '',
    setText: vi.fn(),
    onSpeak: vi.fn(),
    onClear: vi.fn(),
    autoSpeak: true,
    editing: false,
    setEditing: vi.fn(),
    expanded: false,
    onCollapse: vi.fn(),
    suggestions: [],
    onSuggestionTap: vi.fn(),
    ...overrides,
  };
  render(<SpeechBar {...props} />);
  return props;
}

describe('SpeechBar', () => {
  describe('Empty mode', () => {
    it('shows placeholder text', () => {
      renderSpeechBar();
      expect(screen.getByText('Tap here to type...')).toBeInTheDocument();
    });

    it('enters edit mode when placeholder is clicked', async () => {
      const user = userEvent.setup();
      const props = renderSpeechBar();

      await user.click(screen.getByText('Tap here to type...'));
      expect(props.setEditing).toHaveBeenCalledWith(true);
    });

    it('shows keyboard icon button when empty', () => {
      renderSpeechBar();
      expect(screen.getByRole('button', { name: 'Open keyboard' })).toBeInTheDocument();
    });
  });

  describe('Filled mode (auto-speak on)', () => {
    it('shows the spoken text', () => {
      renderSpeechBar({ text: 'I need water' });
      expect(screen.getByText('I need water')).toBeInTheDocument();
    });

    it('shows replay, edit, and clear buttons', () => {
      renderSpeechBar({ text: 'I need water' });
      expect(screen.getByRole('button', { name: 'Replay message' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Edit message' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Clear message' })).toBeInTheDocument();
    });

    it('calls onSpeak when replay button is clicked', async () => {
      const user = userEvent.setup();
      const props = renderSpeechBar({ text: 'I need water' });

      await user.click(screen.getByRole('button', { name: 'Replay message' }));
      expect(props.onSpeak).toHaveBeenCalledOnce();
    });

    it('enters edit mode when edit button is clicked', async () => {
      const user = userEvent.setup();
      const props = renderSpeechBar({ text: 'I need water' });

      await user.click(screen.getByRole('button', { name: 'Edit message' }));
      expect(props.setEditing).toHaveBeenCalledWith(true);
    });

    it('calls onClear when clear button is clicked', async () => {
      const user = userEvent.setup();
      const props = renderSpeechBar({ text: 'I need water' });

      await user.click(screen.getByRole('button', { name: 'Clear message' }));
      expect(props.onClear).toHaveBeenCalledOnce();
    });
  });

  describe('Filled mode (auto-speak off)', () => {
    it('shows a prominent speak button instead of replay', () => {
      renderSpeechBar({ text: 'I need water', autoSpeak: false });
      expect(screen.getByRole('button', { name: 'Speak message' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Edit message' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Clear message' })).toBeInTheDocument();
    });
  });

  describe('Edit mode', () => {
    it('renders an input field', () => {
      renderSpeechBar({ text: 'Hello', editing: true });
      const input = screen.getByPlaceholderText('Type your message...');
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue('Hello');
    });

    it('shows play and clear buttons when editing with text', () => {
      renderSpeechBar({ text: 'Hello', editing: true });
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(2); // play + clear buttons
      expect(screen.getByLabelText('Speak message')).toBeInTheDocument();
      expect(screen.getByLabelText('Clear message')).toBeInTheDocument();
    });

    it('calls setText on input change', async () => {
      const user = userEvent.setup();
      const props = renderSpeechBar({ text: '', editing: true });

      await user.type(screen.getByPlaceholderText('Type your message...'), 'Hi');
      expect(props.setText).toHaveBeenCalled();
    });

    it('speaks and exits edit mode on Enter', async () => {
      const user = userEvent.setup();
      const props = renderSpeechBar({ text: 'Hello', editing: true });

      await user.keyboard('{Enter}');
      expect(props.setEditing).toHaveBeenCalledWith(false);
      expect(props.onSpeak).toHaveBeenCalledOnce();
    });
  });

  describe('Expanded mode', () => {
    it('renders a textarea instead of a single-line input', () => {
      renderSpeechBar({ text: 'Hello', editing: true, expanded: true });
      const textarea = screen.getByRole('textbox');
      expect(textarea.tagName).toBe('TEXTAREA');
    });

    it('renders a large Speak button with label text', () => {
      renderSpeechBar({ text: 'Hello', editing: true, expanded: true });
      const speakBtn = screen.getByRole('button', { name: /speak/i });
      expect(speakBtn).toBeInTheDocument();
      expect(speakBtn.textContent).toContain('Speak');
    });

    it('renders a large Clear button with label text', () => {
      renderSpeechBar({ text: 'Hello', editing: true, expanded: true });
      const clearBtn = screen.getByRole('button', { name: /clear/i });
      expect(clearBtn).toBeInTheDocument();
      expect(clearBtn.textContent).toContain('Clear');
    });

    it('renders a Collapse button', () => {
      renderSpeechBar({ text: 'Hello', editing: true, expanded: true });
      expect(screen.getByRole('button', { name: /collapse/i })).toBeInTheDocument();
    });

    it('calls onCollapse when collapse button is tapped', async () => {
      const user = userEvent.setup();
      const props = renderSpeechBar({ text: 'Hello', editing: true, expanded: true });

      await user.click(screen.getByRole('button', { name: /collapse/i }));
      expect(props.onCollapse).toHaveBeenCalledOnce();
    });

    it('calls onSpeak when Speak button is tapped', async () => {
      const user = userEvent.setup();
      const props = renderSpeechBar({ text: 'Hello', editing: true, expanded: true });

      await user.click(screen.getByRole('button', { name: /speak/i }));
      expect(props.onSpeak).toHaveBeenCalledOnce();
    });

    it('calls onClear when Clear button is tapped', async () => {
      const user = userEvent.setup();
      const props = renderSpeechBar({ text: 'Hello', editing: true, expanded: true });

      await user.click(screen.getByRole('button', { name: /clear/i }));
      expect(props.onClear).toHaveBeenCalledOnce();
    });

    it('renders suggestion chips when suggestions is non-empty', () => {
      renderSpeechBar({
        text: 'wat',
        editing: true,
        expanded: true,
        suggestions: ['Water', 'Water please', 'I need water'],
      });
      expect(screen.getByText('Water')).toBeInTheDocument();
      expect(screen.getByText('Water please')).toBeInTheDocument();
      expect(screen.getByText('I need water')).toBeInTheDocument();
    });

    it('does not render suggestion chips when suggestions is empty', () => {
      renderSpeechBar({ text: 'zzz', editing: true, expanded: true, suggestions: [] });
      expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });

    it('calls onSuggestionTap when a chip is tapped', async () => {
      const user = userEvent.setup();
      const props = renderSpeechBar({
        text: 'wat',
        editing: true,
        expanded: true,
        suggestions: ['Water', 'Water please'],
      });

      await user.click(screen.getByText('Water'));
      expect(props.onSuggestionTap).toHaveBeenCalledWith('Water');
    });

    it('does not render collapsed-mode buttons in expanded mode', () => {
      renderSpeechBar({ text: 'Hello', editing: true, expanded: true });
      // In expanded mode, the old small speak/clear buttons should not be present
      // Instead, we have the large labeled Speak and Clear
      const buttons = screen.getAllByRole('button');
      // Should have: Speak, Clear, Collapse = 3 buttons (no small icon-only buttons)
      expect(buttons.length).toBe(3);
    });
  });
});
