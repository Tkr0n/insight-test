import { PrismaClient, Task, TaskStatus } from '@prisma/client';
import { validateStateTransition } from '../use-cases/state-machine';
import { AppError } from '../middlewares/error-handler';

export interface CreateTaskInput {
  title: string;
  description?: string;
  ownerId: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
}

export interface ITaskRepository {
  findById(id: string, ownerId: string): Promise<Task | null>;
  findByOwner(ownerId: string): Promise<Task[]>;
  create(data: CreateTaskInput): Promise<Task>;
  update(id: string, ownerId: string, data: UpdateTaskInput): Promise<Task>;
  delete(id: string, ownerId: string): Promise<void>;
  updateTaskStatusLocked(taskId: string, ownerId: string, newStatus: string): Promise<Task>;
}

export class TaskRepository implements ITaskRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string, ownerId: string): Promise<Task | null> {
    return this.prisma.task.findFirst({
      where: { id, ownerId },
    });
  }

  async findByOwner(ownerId: string): Promise<Task[]> {
    return this.prisma.task.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: CreateTaskInput): Promise<Task> {
    return this.prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        ownerId: data.ownerId,
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
      validateStateTransition(task.status, data.status);
    }

    return this.prisma.task.update({
      where: { id, ownerId },
      data,
    });
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
        SELECT * FROM "Task"
        WHERE id = ${taskId}::uuid AND owner_id = ${ownerId}
        FOR UPDATE
      `;

      if (lockedRows.length === 0) {
        throw new AppError(404, 'Task not found or access denied');
      }

      const currentTask = lockedRows[0];
      validateStateTransition(currentTask.status, newStatus);

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
