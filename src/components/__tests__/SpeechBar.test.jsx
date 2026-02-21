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
      // Keyboard icon button
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Filled mode (auto-speak on)', () => {
    it('shows the spoken text', () => {
      renderSpeechBar({ text: 'I need water' });
      expect(screen.getByText('I need water')).toBeInTheDocument();
    });

    it('shows replay, edit, and clear buttons', () => {
      renderSpeechBar({ text: 'I need water' });
      // replay, edit, clear = 3 buttons
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(3);
    });

    it('calls onSpeak when replay button is clicked', async () => {
      const user = userEvent.setup();
      const props = renderSpeechBar({ text: 'I need water' });

      // First button is replay
      const buttons = screen.getAllByRole('button');
      await user.click(buttons[0]);
      expect(props.onSpeak).toHaveBeenCalledOnce();
    });

    it('enters edit mode when edit button is clicked', async () => {
      const user = userEvent.setup();
      const props = renderSpeechBar({ text: 'I need water' });

      const buttons = screen.getAllByRole('button');
      await user.click(buttons[1]); // edit button
      expect(props.setEditing).toHaveBeenCalledWith(true);
    });

    it('calls onClear when clear button is clicked', async () => {
      const user = userEvent.setup();
      const props = renderSpeechBar({ text: 'I need water' });

      const buttons = screen.getAllByRole('button');
      await user.click(buttons[2]); // clear button
      expect(props.onClear).toHaveBeenCalledOnce();
    });
  });

  describe('Filled mode (auto-speak off)', () => {
    it('shows a prominent speak button instead of replay', () => {
      renderSpeechBar({ text: 'I need water', autoSpeak: false });
      // Speak button is present (larger, blue)
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(3); // speak, edit, clear
    });
  });

  describe('Edit mode', () => {
    it('renders an input field', () => {
      renderSpeechBar({ text: 'Hello', editing: true });
      const input = screen.getByPlaceholderText('Type your message...');
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue('Hello');
    });

    it('shows play button when editing with text', () => {
      renderSpeechBar({ text: 'Hello', editing: true });
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(1); // play button
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
});
