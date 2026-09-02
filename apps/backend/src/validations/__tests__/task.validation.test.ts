import { createTaskSchema, updateTaskSchema } from '../task';
import { shareTaskSchema } from '../share';

describe('createTaskSchema extended', () => {
  it('acepta payload válido con todos los campos extendidos', () => {
    const result = createTaskSchema.safeParse({
      title: 'Test task',
      description: 'desc',
      assigneeId: 'user-123',
      startDate: '2026-01-01T00:00:00.000Z',
      dueDate: '2026-01-10',
      urgency: 2,
      importance: 3,
      tags: ['frontend'],
    });
    expect(result.success).toBe(true);
  });

  it('acepta urgency en rango 1-4 e importance en rango 1-4', () => {
    for (const urgency of [1, 2, 3, 4]) {
      const r = createTaskSchema.safeParse({ title: 't', urgency });
      expect(r.success).toBe(true);
    }
    for (const importance of [1, 2, 3, 4]) {
      const r = createTaskSchema.safeParse({ title: 't', importance });
      expect(r.success).toBe(true);
    }
  });

  it('acepta tags con un elemento válido', () => {
    const result = createTaskSchema.safeParse({ title: 't', tags: ['frontend'] });
    expect(result.success).toBe(true);
  });

  it('acepta assigneeId, startDate y dueDate válidos', () => {
    const result = createTaskSchema.safeParse({
      title: 't',
      assigneeId: 'assignee-1',
      startDate: '2026-01-01T10:00:00Z',
      dueDate: '2026-12-31',
    });
    expect(result.success).toBe(true);
  });

  it('acepta startDate y dueDate como null', () => {
    const result = createTaskSchema.safeParse({
      title: 't',
      startDate: null,
      dueDate: null,
    });
    expect(result.success).toBe(true);
  });

  it('rechaza urgency 0', () => {
    const result = createTaskSchema.safeParse({ title: 't', urgency: 0 });
    expect(result.success).toBe(false);
  });

  it('rechaza urgency 5', () => {
    const result = createTaskSchema.safeParse({ title: 't', urgency: 5 });
    expect(result.success).toBe(false);
  });

  it('rechaza urgency como string', () => {
    const result = createTaskSchema.safeParse({ title: 't', urgency: 'high' as unknown as number });
    expect(result.success).toBe(false);
  });

  it('rechaza tags con más de 10 items', () => {
    const tags = Array.from({ length: 11 }, (_, i) => `tag${i}`);
    const result = createTaskSchema.safeParse({ title: 't', tags });
    expect(result.success).toBe(false);
  });

  it('rechaza tag con más de 50 caracteres', () => {
    const longTag = 'a'.repeat(51);
    const result = createTaskSchema.safeParse({ title: 't', tags: [longTag] });
    expect(result.success).toBe(false);
  });

  it('rechaza tags cuando no es array', () => {
    const result = createTaskSchema.safeParse({ title: 't', tags: 'frontend' as unknown as string[] });
    expect(result.success).toBe(false);
  });

  it('rechaza importance fuera de rango', () => {
    expect(createTaskSchema.safeParse({ title: 't', importance: 0 }).success).toBe(false);
    expect(createTaskSchema.safeParse({ title: 't', importance: 5 }).success).toBe(false);
  });

  describe('updateTaskSchema patch parcial', () => {
    it('acepta patch parcial con solo urgency', () => {
      const result = updateTaskSchema.safeParse({ urgency: 3 });
      expect(result.success).toBe(true);
    });

    it('acepta patch parcial con solo tags', () => {
      const result = updateTaskSchema.safeParse({ tags: ['backend', 'api'] });
      expect(result.success).toBe(true);
    });

    it('acepta patch parcial con solo importance', () => {
      const result = updateTaskSchema.safeParse({ importance: 1 });
      expect(result.success).toBe(true);
    });

    it('acepta patch parcial vacío', () => {
      const result = updateTaskSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('rechaza patch parcial con urgency inválido', () => {
      const result = updateTaskSchema.safeParse({ urgency: 10 });
      expect(result.success).toBe(false);
    });
  });
});

describe('shareTaskSchema', () => {
  it('acepta userId válido', () => {
    const result = shareTaskSchema.safeParse({ userId: 'user-abc-123' });
    expect(result.success).toBe(true);
  });

  it('rechaza userId vacío', () => {
    const result = shareTaskSchema.safeParse({ userId: '' });
    expect(result.success).toBe(false);
  });

  it('rechaza cuando falta userId', () => {
    const result = shareTaskSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rechaza userId no string', () => {
    const result = shareTaskSchema.safeParse({ userId: 123 as unknown as string });
    expect(result.success).toBe(false);
  });
});
