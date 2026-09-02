import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { KanbanBoard } from '../KanbanBoard';
import type { Task, TaskStatus } from '../../types/task';

// ------------------------------------------------------------------ dnd-kit mocks
// Capture onDragEnd so tests can simulate drag
let capturedOnDragEnd: ((e: unknown) => void) | null = null;

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children, onDragEnd }: { children: React.ReactNode; onDragEnd: (e: unknown) => void }) => {
    capturedOnDragEnd = onDragEnd;
    return <div data-testid="dnd-context">{children}</div>;
  },
  closestCenter: vi.fn(),
  useDroppable: () => ({ setNodeRef: vi.fn(), isOver: false }),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  verticalListSortingStrategy: vi.fn(),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}));

// ------------------------------------------------------------------ helpers
function makeTask(overrides: Partial<Task> & { id: string; status: TaskStatus }): Task {
  return {
    title: `Task ${overrides.id}`,
    description: null,
    ownerId: 'owner-1',
    assigneeId: null,
    startDate: null,
    dueDate: null,
    urgency: 2,
    importance: 2,
    tags: [],
    version: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const defaultProps = {
  currentUserId: 'owner-1',
  onMove: vi.fn(),
  onTransition: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onShare: vi.fn(),
};

describe('KanbanBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedOnDragEnd = null;
  });

  it('renderiza 4 columnas PENDING/IN_PROGRESS/DONE/ARCHIVED con conteos', () => {
    render(<KanbanBoard tasks={[]} {...defaultProps} />);
    expect(screen.getByText('Pending (0)')).toBeInTheDocument();
    expect(screen.getByText('In Progress (0)')).toBeInTheDocument();
    expect(screen.getByText('Done (0)')).toBeInTheDocument();
    expect(screen.getByText('Archived (0)')).toBeInTheDocument();
  });

  it('agrupa tasks por status correctamente', () => {
    const tasks: Task[] = [
      makeTask({ id: 't1', status: 'PENDING', title: 'Alpha' }),
      makeTask({ id: 't2', status: 'PENDING', title: 'Beta' }),
      makeTask({ id: 't3', status: 'IN_PROGRESS', title: 'Gamma' }),
      makeTask({ id: 't4', status: 'DONE', title: 'Delta' }),
      makeTask({ id: 't5', status: 'ARCHIVED', title: 'Epsilon' }),
    ];
    render(<KanbanBoard tasks={tasks} {...defaultProps} />);
    // Counts reflect grouping
    expect(screen.getByText('Pending (2)')).toBeInTheDocument();
    expect(screen.getByText('In Progress (1)')).toBeInTheDocument();
    expect(screen.getByText('Done (1)')).toBeInTheDocument();
    expect(screen.getByText('Archived (1)')).toBeInTheDocument();
    // Task titles appear
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('Gamma')).toBeInTheDocument();
    expect(screen.getByText('Delta')).toBeInTheDocument();
    expect(screen.getByText('Epsilon')).toBeInTheDocument();
  });

  it('muestra "No tasks" cuando vacío', () => {
    render(<KanbanBoard tasks={[]} {...defaultProps} />);
    // One per column = 4
    const emptyMessages = screen.getAllByText('No tasks');
    expect(emptyMessages).toHaveLength(4);
  });

  it('llama onMove cuando dragEnd es simulado sobre columna destino válida', () => {
    const tasks: Task[] = [
      makeTask({ id: 't1', status: 'PENDING', title: 'Alpha' }),
    ];
    const onMove = vi.fn();
    render(<KanbanBoard tasks={tasks} {...{ ...defaultProps, onMove }} />);
    expect(capturedOnDragEnd).not.toBeNull();
    // Simulate drag t1 -> IN_PROGRESS (valid transition PENDING->IN_PROGRESS)
    capturedOnDragEnd!({
      active: { id: 't1' },
      over: { id: 'IN_PROGRESS', data: { current: {} } },
    });
    expect(onMove).toHaveBeenCalledWith('t1', 'IN_PROGRESS');

    // Invalid transition: PENDING -> DONE is not allowed (PENDING only allows IN_PROGRESS, ARCHIVED)
    onMove.mockClear();
    capturedOnDragEnd!({
      active: { id: 't1' },
      over: { id: 'DONE', data: { current: {} } },
    });
    expect(onMove).not.toHaveBeenCalled();
  });

  it('no llama onMove si destino es mismo status o sin over', () => {
    const tasks: Task[] = [
      makeTask({ id: 't1', status: 'PENDING', title: 'Alpha' }),
    ];
    const onMove = vi.fn();
    render(<KanbanBoard tasks={tasks} {...{ ...defaultProps, onMove }} />);
    // Same status
    capturedOnDragEnd!({
      active: { id: 't1' },
      over: { id: 'PENDING', data: { current: {} } },
    });
    expect(onMove).not.toHaveBeenCalled();
    // No over
    capturedOnDragEnd!({
      active: { id: 't1' },
      over: null,
    });
    expect(onMove).not.toHaveBeenCalled();
  });

  it('resuelve destino cuando over es otro task id (drop sobre tarea)', () => {
    const tasks: Task[] = [
      makeTask({ id: 't1', status: 'PENDING', title: 'Alpha' }),
      makeTask({ id: 't2', status: 'IN_PROGRESS', title: 'Gamma' }),
    ];
    const onMove = vi.fn();
    render(<KanbanBoard tasks={tasks} {...{ ...defaultProps, onMove }} />);
    // Drag t1 over t2 -> should resolve to IN_PROGRESS
    capturedOnDragEnd!({
      active: { id: 't1' },
      over: { id: 't2', data: { current: {} } },
    });
    expect(onMove).toHaveBeenCalledWith('t1', 'IN_PROGRESS');
  });
});
