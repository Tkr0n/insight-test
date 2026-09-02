import { TaskRepository } from '../task-repository.js';
import type { PrismaClient } from '@prisma/client';

const baseTask = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  title: 'Test task',
  description: 'desc',
  status: 'PENDING' as const,
  ownerId: 'owner-1',
  assigneeId: 'assignee-1',
  startDate: null,
  dueDate: null,
  urgency: 2,
  importance: 3,
  tags: ['frontend', 'urgent'] as string[],
  version: 1,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

function createMockPrisma() {
  return {
    user: {
      upsert: jest.fn().mockResolvedValue({ id: 'owner-1', email: 'owner@placeholder.local' }),
    },
    task: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([baseTask]),
      create: jest.fn().mockImplementation((args: { data: Record<string, unknown> }) =>
        Promise.resolve({
          ...baseTask,
          ...args.data,
          id: baseTask.id,
          status: 'PENDING',
          version: 1,
          createdAt: baseTask.createdAt,
          updatedAt: baseTask.updatedAt,
        }),
      ),
      update: jest.fn().mockImplementation((args: { where: { id: string }; data: Record<string, unknown> }) =>
        Promise.resolve({ ...baseTask, ...args.data }),
      ),
      delete: jest.fn().mockResolvedValue(baseTask),
    },
    taskShare: {
      create: jest.fn().mockResolvedValue({ taskId: baseTask.id, userId: 'shared-1' }),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
  } as unknown as PrismaClient;
}

describe('TaskRepository - filters & permissions', () => {
  // 1 – findByOwner includes OR owner/assignee/shares
  it('findByOwner includes OR owner/assignee/shares', async () => {
    const prisma = createMockPrisma();
    const repo = new TaskRepository(prisma);

    await repo.findByOwner('owner-1');

    const call = (prisma.task.findMany as jest.Mock).mock.calls[0][0];
    expect(call.where.OR).toBeDefined();
    expect(call.where.OR).toEqual(
      expect.arrayContaining([
        { ownerId: 'owner-1' },
        { assigneeId: 'owner-1' },
        { shares: { some: { userId: 'owner-1' } } },
      ]),
    );
    expect(call.orderBy).toEqual({ createdAt: 'desc' });
  });

  // 2 – findByOwner filtra por tags hasSome
  it('findByOwner filtra por tags hasSome', async () => {
    const prisma = createMockPrisma();
    const repo = new TaskRepository(prisma);

    await repo.findByOwner('owner-1', { tags: ['frontend', 'backend'] });

    const where = (prisma.task.findMany as jest.Mock).mock.calls[0][0].where;
    expect(where.tags).toEqual({ hasSome: ['frontend', 'backend'] });
    // OR still present
    expect(where.OR).toBeDefined();
  });

  // 3 – findByOwner filtra por urgency y importance
  it('findByOwner filtra por urgency y importance', async () => {
    const prisma = createMockPrisma();
    const repo = new TaskRepository(prisma);

    await repo.findByOwner('owner-1', { urgency: 4, importance: 5 });

    const where = (prisma.task.findMany as jest.Mock).mock.calls[0][0].where;
    expect(where.urgency).toBe(4);
    expect(where.importance).toBe(5);
  });

  // 4 – findByOwner filtra por title contains insensitive
  it('findByOwner filtra por title contains insensitive', async () => {
    const prisma = createMockPrisma();
    const repo = new TaskRepository(prisma);

    await repo.findByOwner('owner-1', { title: 'Fix bug' });

    const where = (prisma.task.findMany as jest.Mock).mock.calls[0][0].where;
    expect(where.title).toEqual({ contains: 'Fix bug', mode: 'insensitive' });
  });

  // 5 – findByOwner filtra por overdue (dueDate < now)
  it('findByOwner filtra por overdue (dueDate < now)', async () => {
    const prisma = createMockPrisma();
    const repo = new TaskRepository(prisma);

    const before = Date.now();
    await repo.findByOwner('owner-1', { overdue: true });
    const after = Date.now();

    const where = (prisma.task.findMany as jest.Mock).mock.calls[0][0].where;
    expect(where.dueDate).toBeDefined();
    expect(where.dueDate.lt).toBeInstanceOf(Date);
    const ts = (where.dueDate.lt as Date).getTime();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  // 6 – findByOwner filtra por status in
  it('findByOwner filtra por status in', async () => {
    const prisma = createMockPrisma();
    const repo = new TaskRepository(prisma);

    await repo.findByOwner('owner-1', { status: ['PENDING', 'IN_PROGRESS'] as never });

    const where = (prisma.task.findMany as jest.Mock).mock.calls[0][0].where;
    expect(where.status).toEqual({ in: ['PENDING', 'IN_PROGRESS'] });
  });

  // 7 – findAccessibleTask retorna task si es owner/assignee/shared
  it('findAccessibleTask retorna task si es owner/assignee/shared', async () => {
    const prisma = createMockPrisma();
    // findFirst returns matching task when id matches
    (prisma.task.findFirst as jest.Mock).mockImplementation((args: { where: { id: string } }) => {
      if (args.where.id === baseTask.id) return Promise.resolve(baseTask);
      return Promise.resolve(null);
    });
    const repo = new TaskRepository(prisma);

    const result = await repo.findAccessibleTask(baseTask.id, 'owner-1');
    expect(result).not.toBeNull();
    expect(result?.id).toBe(baseTask.id);

    const call = (prisma.task.findFirst as jest.Mock).mock.calls[0][0];
    expect(call.where.id).toBe(baseTask.id);
    expect(call.where.OR).toEqual(
      expect.arrayContaining([
        { ownerId: 'owner-1' },
        { assigneeId: 'owner-1' },
        { shares: { some: { userId: 'owner-1' } } },
      ]),
    );
  });

  // 8 – create persiste tags, urgency, dates
  it('create persiste tags, urgency, dates', async () => {
    const prisma = createMockPrisma();
    const repo = new TaskRepository(prisma);

    await repo.create({
      title: 'New task',
      ownerId: 'owner-1',
      assigneeId: 'assignee-2',
      urgency: 4,
      importance: 5,
      tags: ['a', 'b'],
      startDate: '2026-03-01T10:00:00.000Z',
      dueDate: '2026-03-10T10:00:00.000Z',
      description: 'hello',
    });

    const call = (prisma.task.create as jest.Mock).mock.calls[0][0];
    expect(call.data.title).toBe('New task');
    expect(call.data.ownerId).toBe('owner-1');
    expect(call.data.assigneeId).toBe('assignee-2');
    expect(call.data.urgency).toBe(4);
    expect(call.data.importance).toBe(5);
    expect(call.data.tags).toEqual(['a', 'b']);
    expect(call.data.description).toBe('hello');
    expect(call.data.startDate).toBeInstanceOf(Date);
    expect(call.data.startDate.toISOString()).toBe('2026-03-01T10:00:00.000Z');
    expect(call.data.dueDate).toBeInstanceOf(Date);
    expect(call.data.dueDate.toISOString()).toBe('2026-03-10T10:00:00.000Z');
  });

  // Extra: create with defaults when optional fields omitted
  it('create usa defaults cuando tags/dates no se proveen', async () => {
    const prisma = createMockPrisma();
    const repo = new TaskRepository(prisma);

    await repo.create({ title: 'Minimal', ownerId: 'owner-1' });

    const call = (prisma.task.create as jest.Mock).mock.calls[0][0];
    expect(call.data.tags).toEqual([]);
    expect(call.data.startDate).toBeNull();
    expect(call.data.dueDate).toBeNull();
    expect(call.data.assigneeId).toBeNull();
  });
});
