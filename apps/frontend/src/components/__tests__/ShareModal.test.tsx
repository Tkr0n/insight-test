import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShareModal } from '../ShareModal';
import type { Task } from '../../types/task';

const mockTask: Task = {
  id: 'task-1',
  title: 'Test Task',
  description: 'desc',
  status: 'PENDING',
  ownerId: 'owner-1',
  assigneeId: null,
  startDate: null,
  dueDate: null,
  urgency: 2,
  importance: 3,
  tags: [],
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockUsers = [
  { id: 'owner-1', email: 'owner@test.com', name: 'Owner' },
  { id: 'u1', email: 'alice@test.com', name: 'Alice' },
  { id: 'u2', email: 'bob@test.com', name: 'Bob' },
];

const mockShares = [
  { id: 's1', taskId: 'task-1', userId: 'u1', sharedAt: new Date().toISOString() },
];

const mockShareMutate = vi.fn();
const mockUnshareMutate = vi.fn();

vi.mock('../../hooks/useShareTask', () => ({
  useShares: vi.fn(),
  useShareTask: vi.fn(),
  useUnshareTask: vi.fn(),
}));

vi.mock('../../hooks/useUsers', () => ({
  useUsers: vi.fn(),
}));

import { useShares, useShareTask, useUnshareTask } from '../../hooks/useShareTask';
import { useUsers } from '../../hooks/useUsers';

function setupMocks(overrides?: {
  shares?: typeof mockShares;
  users?: typeof mockUsers;
  sharesLoading?: boolean;
}) {
  vi.mocked(useShares).mockReturnValue({
    data: overrides?.shares ?? [],
    isLoading: overrides?.sharesLoading ?? false,
    isFetching: false,
  } as unknown as ReturnType<typeof useShares>);

  vi.mocked(useUsers).mockReturnValue({
    data: overrides?.users ?? mockUsers,
    isLoading: false,
  } as unknown as ReturnType<typeof useUsers>);

  vi.mocked(useShareTask).mockReturnValue({
    mutate: mockShareMutate,
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useShareTask>);

  vi.mocked(useUnshareTask).mockReturnValue({
    mutate: mockUnshareMutate,
    isPending: false,
    isError: false,
    variables: undefined,
  } as unknown as ReturnType<typeof useUnshareTask>);
}

describe('ShareModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza Dialog cuando open=true', () => {
    setupMocks();
    render(<ShareModal open={true} task={mockTask} onClose={vi.fn()} />);

    expect(screen.getByText(/Share Task/)).toBeInTheDocument();
    expect(screen.getByText(/Test Task/)).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('no renderiza contenido visible cuando open=false', () => {
    setupMocks();
    render(<ShareModal open={false} task={mockTask} onClose={vi.fn()} />);

    // MUI Dialog with open=false should not show title
    expect(screen.queryByText(/Share Task/)).not.toBeInTheDocument();
  });

  it('muestra lista vacía y botón Add disabled sin selección', () => {
    setupMocks({ shares: [] });
    render(<ShareModal open={true} task={mockTask} onClose={vi.fn()} />);

    expect(screen.getByText(/Not shared with anyone yet/)).toBeInTheDocument();
    expect(screen.getByText(/Shared with \(0\)/)).toBeInTheDocument();

    const addBtn = screen.getByRole('button', { name: /^Add$/ });
    expect(addBtn).toBeDisabled();
  });

  it('llama useShares mock y muestra shares', () => {
    setupMocks({ shares: mockShares });
    render(<ShareModal open={true} task={mockTask} onClose={vi.fn()} />);

    expect(useShares).toHaveBeenCalledWith('task-1');
    expect(screen.getByText(/Shared with \(1\)/)).toBeInTheDocument();
    // Alice label includes email
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
    expect(screen.getByText('alice@test.com')).toBeInTheDocument();
  });

  it('botón Close llama onClose', async () => {
    setupMocks();
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<ShareModal open={true} task={mockTask} onClose={onClose} />);

    // Footer Close button: distinguish from IconButton aria-label Close by text content
    const closeBtn = screen.getByText(/^Close$/).closest('button') as HTMLButtonElement;
    expect(closeBtn).toBeInTheDocument();
    await user.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('botón X (IconButton) también llama onClose', async () => {
    setupMocks();
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<ShareModal open={true} task={mockTask} onClose={onClose} />);

    const xBtn = screen.getByLabelText('Close');
    await user.click(xBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
