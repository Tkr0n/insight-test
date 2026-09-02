import { PrismaClient, Task, TaskStatus, TaskShare } from '@prisma/client';
import { validateStateTransition, TaskStatus as StateStatus } from '../use-cases/state-machine.js';
import { AppError } from '../middlewares/error-handler.js';

export interface CreateTaskInput {
  title: string;
  description?: string;
  ownerId: string;
  assigneeId?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  urgency?: number;
  importance?: number;
  tags?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  assigneeId?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  urgency?: number;
  importance?: number;
  tags?: string[];
}

export interface TaskFilter {
  tags?: string[];
  assigneeId?: string;
  urgency?: number;
  importance?: number;
  startDateFrom?: string;
  startDateTo?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  title?: string;
  overdue?: boolean;
  status?: TaskStatus[];
}

export interface ITaskRepository {
  findById(id: string, ownerId: string): Promise<Task | null>;
  findByOwner(ownerId: string, filters?: TaskFilter): Promise<Task[]>;
  create(data: CreateTaskInput): Promise<Task>;
  update(id: string, ownerId: string, data: UpdateTaskInput): Promise<Task>;
  delete(id: string, ownerId: string): Promise<void>;
  updateTaskStatusLocked(taskId: string, ownerId: string, newStatus: string): Promise<Task>;
  findAccessibleTask(id: string, userId: string): Promise<Task | null>;
  shareTask(taskId: string, userId: string): Promise<TaskShare>;
  unshareTask(taskId: string, userId: string): Promise<void>;
  findDistinctAssignees(userId: string): Promise<string[]>;
  updateWithPermission(id: string, callerId: string, data: UpdateTaskInput): Promise<Task>;
}

export class TaskRepository implements ITaskRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string, ownerId: string): Promise<Task | null> {
    return this.prisma.task.findFirst({
      where: { id, ownerId },
    });
  }

  async findAccessibleTask(id: string, userId: string): Promise<Task | null> {
    return this.prisma.task.findFirst({
      where: {
        id,
        OR: [{ ownerId: userId }, { assigneeId: userId }, { shares: { some: { userId } } }],
      },
    });
  }

  async findByOwner(ownerId: string, filters?: TaskFilter): Promise<Task[]> {
    const where: Record<string, unknown> = {
      OR: [{ ownerId }, { assigneeId: ownerId }, { shares: { some: { userId: ownerId } } }],
    };

    if (filters?.tags?.length) {
      (where as Record<string, unknown>).tags = { hasSome: filters.tags };
    }
    if (filters?.urgency !== undefined) {
      (where as Record<string, unknown>).urgency = filters.urgency;
    }
    if (filters?.importance !== undefined) {
      (where as Record<string, unknown>).importance = filters.importance;
    }
    if (filters?.title) {
      (where as Record<string, unknown>).title = { contains: filters.title, mode: 'insensitive' };
    }
    if (filters?.assigneeId) {
      (where as Record<string, unknown>).assigneeId = filters.assigneeId;
    }
    if (filters?.dueDateFrom || filters?.dueDateTo) {
      const dueDate: Record<string, unknown> = {};
      if (filters.dueDateFrom) dueDate.gte = new Date(filters.dueDateFrom);
      if (filters.dueDateTo) dueDate.lte = new Date(filters.dueDateTo);
      (where as Record<string, unknown>).dueDate = dueDate;
    }
    if (filters?.overdue) {
      (where as Record<string, unknown>).dueDate = { lt: new Date() };
    }
    if (filters?.startDateFrom || filters?.startDateTo) {
      const startDate: Record<string, unknown> = {};
      if (filters.startDateFrom) startDate.gte = new Date(filters.startDateFrom);
      if (filters.startDateTo) startDate.lte = new Date(filters.startDateTo);
      (where as Record<string, unknown>).startDate = startDate;
    }
    if (filters?.status?.length) {
      (where as Record<string, unknown>).status = { in: filters.status };
    }

    return this.prisma.task.findMany({
      where: where as never,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: CreateTaskInput): Promise<Task> {
    return this.prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        ownerId: data.ownerId,
        assigneeId: data.assigneeId ?? null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        urgency: data.urgency,
        importance: data.importance,
        tags: data.tags ?? [],
      },
    });
  }

  async update(id: string, ownerId: string, data: UpdateTaskInput): Promise<Task> {
    const task = await this.findById(id, ownerId);
    if (!task) {
      throw new AppError(404, 'Task not found');
    }

    if (task.status === 'DONE' || task.status === 'ARCHIVED') {
      if (data.status || data.description) {
        throw new AppError(422, 'Task is locked: cannot edit status or description of completed tasks');
      }
    }

    if (data.status) {
      validateStateTransition(task.status, data.status as StateStatus);
    }

    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId;
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.urgency !== undefined) updateData.urgency = data.urgency;
    if (data.importance !== undefined) updateData.importance = data.importance;
    if (data.tags !== undefined) updateData.tags = data.tags;

    return this.prisma.task.update({
      where: { id },
      data: updateData as never,
    });
  }

  async updateWithPermission(id: string, callerId: string, data: UpdateTaskInput): Promise<Task> {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) {
      throw new AppError(404, 'Task not found');
    }

    if (data.status !== undefined && callerId !== task.assigneeId) {
      throw new AppError(403, 'Only assignee can change status');
    }

    if (data.assigneeId !== undefined && callerId !== task.ownerId) {
      throw new AppError(403, 'Only owner can reassign task');
    }

    if (task.status === 'DONE' || task.status === 'ARCHIVED') {
      if (data.status || data.description) {
        throw new AppError(422, 'Task is locked: cannot edit status or description of completed tasks');
      }
    }

    if (data.status) {
      validateStateTransition(task.status, data.status as StateStatus);
    }

    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId;
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.urgency !== undefined) updateData.urgency = data.urgency;
    if (data.importance !== undefined) updateData.importance = data.importance;
    if (data.tags !== undefined) updateData.tags = data.tags;

    return this.prisma.task.update({
      where: { id },
      data: updateData as never,
    });
  }

  async shareTask(taskId: string, userId: string): Promise<TaskShare> {
    return this.prisma.taskShare.create({
      data: { taskId, userId },
    });
  }

  async unshareTask(taskId: string, userId: string): Promise<void> {
    await this.prisma.taskShare.deleteMany({
      where: { taskId, userId },
    });
  }

  async findDistinctAssignees(userId: string): Promise<string[]> {
    const tasks = await this.prisma.task.findMany({
      where: {
        OR: [{ ownerId: userId }, { assigneeId: userId }, { shares: { some: { userId } } }],
      },
      select: { assigneeId: true },
    });
    const distinct = new Set<string>();
    for (const t of tasks) {
      if (t.assigneeId) distinct.add(t.assigneeId);
    }
    return Array.from(distinct);
  }

  async delete(id: string, ownerId: string): Promise<void> {
    const task = await this.findById(id, ownerId);
    if (!task) {
      throw new AppError(404, 'Task not found');
    }

    await this.prisma.task.delete({
      where: { id },
    });
  }

  async updateTaskStatusLocked(
    taskId: string,
    ownerId: string,
    newStatus: string
  ): Promise<Task> {
    return this.prisma.$transaction(async (tx) => {
      const lockedRows = await tx.$queryRaw<Task[]>`
        SELECT * FROM "tasks"
        WHERE id = ${taskId}::uuid AND owner_id = ${ownerId}
        FOR UPDATE
      `;

      if (lockedRows.length === 0) {
        throw new AppError(404, 'Task not found or access denied');
      }

      const currentTask = lockedRows[0];
      validateStateTransition(currentTask.status, newStatus as StateStatus);

      return tx.task.update({
        where: { id: taskId },
        data: {
          status: newStatus as TaskStatus,
          version: { increment: 1 },
        },
      });
    });
  }
}
