import { InvokeCommand } from '@aws-sdk/client-lambda';
import { lambdaClient } from '../config/aws';
import { TaskRepository } from '../repositories/task-repository';
import { AppError } from '../middlewares/error-handler';

interface MarkAsDoneInput {
  taskId: string;
  ownerId: string;
}

export class MarkAsDoneUseCase {
  constructor(private readonly taskRepo: TaskRepository) {}

  async execute(input: MarkAsDoneInput): Promise<void> {
    const task = await this.taskRepo.findById(input.taskId, input.ownerId);
    if (!task) {
      throw new AppError(404, 'Task not found');
    }

    const payload = JSON.stringify({
      taskId: input.taskId,
      ownerId: input.ownerId,
      currentStatus: task.status,
    });

    const command = new InvokeCommand({
      FunctionName: 'markAsDone',
      Payload: Buffer.from(payload),
    });

    const response = await lambdaClient.send(command);

    if (response.FunctionError) {
      throw new AppError(502, `Lambda execution failed: ${response.FunctionError}`);
    }
  }
}
