import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TagInput } from '../TagInput';

test('adds tag on Enter', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(<TagInput value={[]} onChange={onChange} />);
  const input = screen.getByPlaceholderText(/add tag/i);
  await user.type(input, 'frontend{enter}');
  expect(onChange).toHaveBeenCalledWith(['frontend']);
});

test('trims whitespace and prevents duplicates', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(<TagInput value={['frontend']} onChange={onChange} />);
  const input = screen.getByPlaceholderText(/add tag/i);
  await user.type(input, '  frontend  {enter}');
  expect(onChange).not.toHaveBeenCalled();
});

test('removes tag on delete', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(<TagInput value={['frontend', 'backend']} onChange={onChange} />);
  const deleteButton = screen.getAllByTestId('CancelIcon')[0];
  await user.click(deleteButton);
  expect(onChange).toHaveBeenCalledWith(['backend']);
});

test('ignores empty input on Enter', async () => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(<TagInput value={[]} onChange={onChange} />);
  const input = screen.getByPlaceholderText(/add tag/i);
  await user.type(input, '   {enter}');
  expect(onChange).not.toHaveBeenCalled();
});
