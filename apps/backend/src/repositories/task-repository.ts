import { PrismaClient, Task, TaskStatus } from '@prisma/client';
import { validateStateTransition } from '@/use-cases/state-machine';

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
      throw new Error('Task not found');
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
    await this.prisma.task.deleteMany({
      where: { id, ownerId },
    });
  }

  async updateTaskStatusLocked(
    taskId: string,
    ownerId: string,
    newStatus: string
  ): Promise<Task> {
    return this.prisma.$transaction(async (tx) => {
      // Pessimistic lock: SELECT ... FOR UPDATE
      const lockedRows = await tx.$queryRaw<Task[]>`
        SELECT * FROM "Task"
        WHERE id = ${taskId}::uuid AND owner_id = ${ownerId}
        FOR UPDATE
      `;

      if (lockedRows.length === 0) {
        throw new Error('Task not found or access denied');
      }

      const currentTask = lockedRows[0];

      // Validate state transition against the locked row
      validateStateTransition(currentTask.status, newStatus);

      // Update status with version increment for optimistic control
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
