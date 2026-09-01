import { NextRequest, NextResponse } from 'next/server';
import { createTaskSchema } from '@/lib/validations/task';

export async function GET(request: NextRequest) {
  // TODO: Extract owner_id from JWT
  // TODO: Fetch tasks from repository
  return NextResponse.json({ message: 'GET /api/tasks - Not implemented' }, { status: 501 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createTaskSchema.parse(body);

    // TODO: Extract owner_id from JWT
    // TODO: Create task in repository
    return NextResponse.json({ message: 'POST /api/tasks - Not implemented', data: validatedData }, { status: 501 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: error }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
