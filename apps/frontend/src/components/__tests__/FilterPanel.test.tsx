import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FilterPanel } from '../FilterPanel';
import type { TaskFilters } from '../../types/task';

vi.mock('../../api/users.api', () => ({
  fetchUsers: vi.fn().mockResolvedValue([
    { id: 'u1', email: 'alice@test.com', name: 'Alice' },
    { id: 'u2', email: 'bob@test.com', name: 'Bob' },
  ]),
}));

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

describe('FilterPanel', () => {
  const baseFilters: TaskFilters = {};

  it('renderiza search title input y llama onChange al escribir', async () => {
    const onChange = vi.fn();
    const onClear = vi.fn();
    render(<FilterPanel filters={baseFilters} onChange={onChange} onClear={onClear} />, {
      wrapper: createWrapper(),
    });

    const input = screen.getByLabelText(/search title/i) as HTMLInputElement;
    expect(input).toBeInTheDocument();

    // Controlled component: fire change directly to avoid per-keystroke controlled reset
    const { fireEvent } = await import('@testing-library/react');
    fireEvent.change(input, { target: { value: 'hello' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ title: 'hello' }));

    // also verify typing triggers onChange at least once via userEvent
    const user = userEvent.setup();
    await user.clear(input);
    onChange.mockClear();
    await user.type(input, 'hi');
    expect(onChange).toHaveBeenCalled();
  });

  it('renderiza urgency select y cambia a 1', async () => {
    const onChange = vi.fn();
    const onClear = vi.fn();
    const user = userEvent.setup();
    render(<FilterPanel filters={baseFilters} onChange={onChange} onClear={onClear} />, {
      wrapper: createWrapper(),
    });

    const urgencyCombo = screen.getByLabelText(/urgency/i);
    expect(urgencyCombo).toBeInTheDocument();

    await user.click(urgencyCombo);
    const listbox = await screen.findByRole('listbox');
    const option = within(listbox).getByText('Non Critical');
    await user.click(option);

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ urgency: 1 }));
  });

  it('renderiza importance select', async () => {
    const onChange = vi.fn();
    const onClear = vi.fn();
    render(<FilterPanel filters={baseFilters} onChange={onChange} onClear={onClear} />, {
      wrapper: createWrapper(),
    });

    const importanceCombo = screen.getByLabelText(/importance/i);
    expect(importanceCombo).toBeInTheDocument();
    // also verify All option exists after opening
    const user = userEvent.setup();
    // need to re-render with user? just check select exists
    await user.click(importanceCombo);
    const listbox = await screen.findByRole('listbox');
    expect(within(listbox).getByText('Non Critical')).toBeInTheDocument();
    expect(within(listbox).getByText('Critical')).toBeInTheDocument();
  });

  it('overdue checkbox toggle llama onChange con overdue true', async () => {
    const onChange = vi.fn();
    const onClear = vi.fn();
    const user = userEvent.setup();
    render(<FilterPanel filters={baseFilters} onChange={onChange} onClear={onClear} />, {
      wrapper: createWrapper(),
    });

    const checkbox = screen.getByLabelText(/overdue/i);
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ overdue: true }));
  });

  it('status multi-select muestra chips', async () => {
    const onChange = vi.fn();
    const onClear = vi.fn();
    const filtersWithStatus: TaskFilters = { status: ['PENDING', 'DONE'] };
    render(<FilterPanel filters={filtersWithStatus} onChange={onChange} onClear={onClear} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('status: PENDING')).toBeInTheDocument();
    expect(screen.getByText('status: DONE')).toBeInTheDocument();
    // status select should display joined value
    expect(screen.getByText('PENDING, DONE')).toBeInTheDocument();
  });

  it('Botón Clear llama onClear', async () => {
    const onChange = vi.fn();
    const onClear = vi.fn();
    const user = userEvent.setup();
    render(<FilterPanel filters={{ title: 'test' }} onChange={onChange} onClear={onClear} />, {
      wrapper: createWrapper(),
    });

    const clearBtn = screen.getByRole('button', { name: /clear/i });
    expect(clearBtn).toBeInTheDocument();
    await user.click(clearBtn);
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
