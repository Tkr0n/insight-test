import { NextRequest, NextResponse } from 'next/server';
import { InvokeCommand } from '@aws-sdk/client-lambda';
import { taskIdSchema } from '@/lib/validations/task';
import { redis } from '@/lib/redis';
import { lambdaClient } from '@/lib/aws';
import { prisma } from '@/lib/prisma';
import { TaskRepository } from '@/repositories/task-repository';
import { InvalidStateTransitionError } from '@/use-cases/state-machine';

const IDEMPOTENCY_TTL_SECONDS = 86400; // 24 hours

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const validatedParams = taskIdSchema.parse({ id });

  // 1. Extract Idempotency-Key header
  const idempotencyKey = request.headers.get('Idempotency-Key');
  if (!idempotencyKey) {
    return NextResponse.json(
      { error: 'Idempotency-Key header is required' },
      { status: 400 }
    );
  }

  // 2. Check idempotency via Redis SETNX
  const redisKey = `idempotency:markAsDone:${idempotencyKey}`;
  const wasSet = await redis.setnx(redisKey, '1');

  if (!wasSet) {
    // Key already exists — duplicate request
    return NextResponse.json(
      { error: 'Conflict: this request has already been processed' },
      { status: 409 }
    );
  }

  // Set TTL so keys don't accumulate forever
  await redis.expire(redisKey, IDEMPOTENCY_TTL_SECONDS);

  // 3. Extract owner_id from JWT (mock via header until Cognito is connected)
  const ownerId = request.headers.get('x-mock-user-id');
  if (!ownerId) {
    return NextResponse.json(
      { error: 'Authentication required: x-mock-user-id header missing' },
      { status: 401 }
    );
  }

  const repository = new TaskRepository(prisma);

  try {
    // 4. Invoke Lambda to process the status change
    const command = new InvokeCommand({
      FunctionName: 'ProcessTaskDoneLambda',
      InvocationType: 'RequestResponse', // synchronous
      Payload: Buffer.from(
        JSON.stringify({
          taskId: validatedParams.id,
          ownerId,
        })
      ),
    });

    const response = await lambdaClient.send(command);

    // Lambda succeeded — update the task with pessimistic locking
    const updatedTask = await repository.updateTaskStatusLocked(
      validatedParams.id,
      ownerId,
      'DONE'
    );

    return NextResponse.json({ task: updatedTask }, { status: 200 });
  } catch (error) {
    // Clean up idempotency key so the client can retry
    await redis.del(redisKey);

    if (error instanceof InvalidStateTransitionError) {
      return NextResponse.json(
        { error: error.message },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
