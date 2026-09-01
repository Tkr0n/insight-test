import { NextRequest, NextResponse } from 'next/server';
import { updateTaskSchema, taskIdSchema } from '@/lib/validations/task';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const validatedParams = taskIdSchema.parse({ id });

  // TODO: Extract owner_id from JWT
  // TODO: Fetch task from repository
  return NextResponse.json({ message: `GET /api/tasks/${validatedParams.id} - Not implemented` }, { status: 501 });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const validatedParams = taskIdSchema.parse({ id });

  try {
    const body = await request.json();
    const validatedData = updateTaskSchema.parse(body);

    // TODO: Extract owner_id from JWT
    // TODO: Update task in repository
    return NextResponse.json({ message: `PUT /api/tasks/${validatedParams.id} - Not implemented`, data: validatedData }, { status: 501 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: error }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const validatedParams = taskIdSchema.parse({ id });

  // TODO: Extract owner_id from JWT
  // TODO: Delete task from repository
  return NextResponse.json({ message: `DELETE /api/tasks/${validatedParams.id} - Not implemented` }, { status: 501 });
}
