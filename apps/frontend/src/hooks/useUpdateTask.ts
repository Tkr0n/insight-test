import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTask } from '../api/tasks.api';
import type { TaskStatus } from '../types/task';

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: {
      id: string;
      title?: string;
      description?: string;
      status?: TaskStatus;
      assigneeId?: string | null;
      startDate?: string | null;
      dueDate?: string | null;
      urgency?: number;
      importance?: number;
      tags?: string[];
    }) => updateTask(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
