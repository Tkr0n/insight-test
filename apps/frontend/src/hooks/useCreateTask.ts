import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTask } from '../api/tasks.api';

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
