import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskCard } from '../../components/TaskCard';
import type { Task } from '../../types/task';

const createTask = (overrides: Partial<Task> = {}): Task => ({
  id: '550e8400-e29b-41d4-a716-446655440000',
  title: 'Test Task',
  description: 'A test description',
  status: 'PENDING',
  ownerId: 'user-1',
  version: 1,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('TaskCard', () => {
  const defaultProps = {
    onTransition: vi.fn(),
    onDelete: vi.fn(),
    onEdit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders task title and description', () => {
    render(<TaskCard task={createTask()} {...defaultProps} />);
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('A test description')).toBeInTheDocument();
  });

  it('shows no transition button for PENDING task (drag to move)', () => {
    render(<TaskCard task={createTask({ status: 'PENDING' })} {...defaultProps} />);
    expect(screen.queryByLabelText('Start')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Mark Done')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Archive')).not.toBeInTheDocument();
  });

  it('shows Mark Done button for IN_PROGRESS task', () => {
    render(<TaskCard task={createTask({ status: 'IN_PROGRESS' })} {...defaultProps} />);
    expect(screen.getByLabelText('Mark Done')).toBeInTheDocument();
  });

  it('shows Archive button for DONE task', () => {
    render(<TaskCard task={createTask({ status: 'DONE' })} {...defaultProps} />);
    expect(screen.getByLabelText('Archive')).toBeInTheDocument();
  });

  it('does not show transition button for ARCHIVED task', () => {
    render(<TaskCard task={createTask({ status: 'ARCHIVED' })} {...defaultProps} />);
    expect(screen.queryByLabelText('Start')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Mark Done')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Archive')).not.toBeInTheDocument();
  });

  it('calls onTransition when transition button is clicked', async () => {
    const user = userEvent.setup();
    const onTransition = vi.fn();
    render(
      <TaskCard
        task={createTask({ status: 'IN_PROGRESS' })}
        {...defaultProps}
        onTransition={onTransition}
      />
    );
    const wrapper = screen.getByLabelText('Mark Done');
    await user.click(within(wrapper).getByRole('button'));
    expect(onTransition).toHaveBeenCalledWith(
      '550e8400-e29b-41d4-a716-446655440000',
      'DONE'
    );
  });

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <TaskCard task={createTask()} {...defaultProps} onDelete={onDelete} />
    );
    const wrapper = screen.getByLabelText('Delete');
    await user.click(within(wrapper).getByRole('button'));
    expect(onDelete).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000');
  });

  it('disables edit button for DONE tasks', () => {
    render(<TaskCard task={createTask({ status: 'DONE' })} {...defaultProps} />);
    const editWrapper = screen.getByLabelText('Edit');
    expect(within(editWrapper).getByRole('button')).toBeDisabled();
  });
});
