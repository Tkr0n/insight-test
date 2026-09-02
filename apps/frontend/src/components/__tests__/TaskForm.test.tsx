import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { TaskForm } from '../TaskForm';

vi.mock('../../hooks/useUsers', () => ({
  useUsers: vi.fn(() => ({ data: undefined, isLoading: false })),
}));

// Helper to render TaskForm open
function renderForm(overrides: Partial<React.ComponentProps<typeof TaskForm>> = {}) {
  const onSubmit = vi.fn();
  const onClose = vi.fn();
  const props: React.ComponentProps<typeof TaskForm> = {
    open: true,
    onClose,
    onSubmit,
    ...overrides,
  };
  const utils = render(<TaskForm {...props} />);
  return { ...utils, onSubmit, onClose };
}

describe('TaskForm', () => {
  it('renderiza campos title/description existentes', () => {
    renderForm();
    expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
  });

  it('renderiza urgency y importance selects con opciones 1-4', async () => {
    const user = userEvent.setup();
    renderForm();

    // Labels exist
    expect(screen.getByLabelText(/Urgency/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Importance/i)).toBeInTheDocument();

    // Open urgency select and verify options 1-4 appear in listbox
    const urgencyCombo = screen.getByLabelText(/Urgency/i);
    await user.click(urgencyCombo);
    const listbox = await screen.findByRole('listbox');
    const optionsUrgency = within(listbox).getAllByRole('option');
    expect(optionsUrgency.map((o) => o.textContent)).toEqual(expect.arrayContaining(['1', '2', '3', '4']));
    // Close by pressing Escape
    await user.keyboard('{Escape}');

    // Open importance select
    const importanceCombo = screen.getByLabelText(/Importance/i);
    await user.click(importanceCombo);
    const listbox2 = await screen.findByRole('listbox');
    const optionsImportance = within(listbox2).getAllByRole('option');
    expect(optionsImportance.map((o) => o.textContent)).toEqual(expect.arrayContaining(['1', '2', '3', '4']));
    await user.keyboard('{Escape}');
  });

  it('renderiza date inputs startDate/dueDate', () => {
    renderForm();
    expect(screen.getByLabelText(/Start Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Due Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Start Date/i)).toHaveAttribute('type', 'date');
    expect(screen.getByLabelText(/Due Date/i)).toHaveAttribute('type', 'date');
  });

  it('renderiza TagInput y añade tag', async () => {
    const user = userEvent.setup();
    renderForm();
    const tagInput = screen.getByPlaceholderText(/Add tag/i);
    expect(tagInput).toBeInTheDocument();
    await user.type(tagInput, 'frontend{enter}');
    // Tag should now appear as chip
    expect(await screen.findByText('frontend')).toBeInTheDocument();
  });

  it('validación dueDate < startDate muestra error y deshabilita submit', async () => {
    const user = userEvent.setup();
    renderForm();
    const titleInput = screen.getByLabelText(/Title/i);
    await user.type(titleInput, 'My Task');

    const startInput = screen.getByLabelText(/Start Date/i);
    const dueInput = screen.getByLabelText(/Due Date/i);

    // Set startDate 2026-06-10, dueDate 2026-06-01 -> due < start
    await user.clear(startInput);
    await user.type(startInput, '2026-06-10');
    await user.clear(dueInput);
    await user.type(dueInput, '2026-06-01');

    // Error message should appear (at least one instance)
    expect(await screen.findAllByText('Due date cannot be before start date')).not.toHaveLength(0);
    // Submit button should be disabled
    const saveBtn = screen.getByRole('button', { name: /Save/i });
    expect(saveBtn).toBeDisabled();
  });

  it('submit envía valores completos via onSubmit mock', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    // Title & Description
    await user.type(screen.getByLabelText(/Title/i), 'Full Task');
    await user.type(screen.getByLabelText(/Description/i), 'Full Desc');

    // Dates
    const startInput = screen.getByLabelText(/Start Date/i);
    const dueInput = screen.getByLabelText(/Due Date/i);
    await user.type(startInput, '2026-06-01');
    await user.type(dueInput, '2026-06-10');

    // Urgency -> 4
    const urgencyCombo = screen.getByLabelText(/Urgency/i);
    await user.click(urgencyCombo);
    const listboxUrg = await screen.findByRole('listbox');
    await user.click(within(listboxUrg).getByRole('option', { name: '4' }));

    // Importance -> 3
    const importanceCombo = screen.getByLabelText(/Importance/i);
    await user.click(importanceCombo);
    const listboxImp = await screen.findByRole('listbox');
    await user.click(within(listboxImp).getByRole('option', { name: '3' }));

    // Tags
    const tagInput = screen.getByPlaceholderText(/Add tag/i);
    await user.type(tagInput, 'alpha{enter}');
    await user.type(tagInput, 'beta{enter}');

    // AssigneeId via fallback TextField "Assignee ID"
    const assigneeInput = screen.getByLabelText(/Assignee ID/i);
    await user.type(assigneeInput, 'user-123');

    // Submit
    const saveBtn = screen.getByRole('button', { name: /Save/i });
    expect(saveBtn).toBeEnabled();
    await user.click(saveBtn);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Full Task',
        description: 'Full Desc',
        urgency: 4,
        importance: 3,
        startDate: '2026-06-01',
        dueDate: '2026-06-10',
        assigneeId: 'user-123',
        tags: ['alpha', 'beta'],
      })
    );
  });

  it('deshabilita submit si title vacío y permite cuando válido', async () => {
    const user = userEvent.setup();
    renderForm();
    const saveBtn = screen.getByRole('button', { name: /Save/i });
    // Title empty -> disabled
    expect(saveBtn).toBeDisabled();
    await user.type(screen.getByLabelText(/Title/i), 'X');
    expect(saveBtn).toBeEnabled();
    await user.clear(screen.getByLabelText(/Title/i));
    expect(saveBtn).toBeDisabled();
  });
});
