import { useMutation, useQueryClient } from '@tanstack/react-query';
import { markAsDone } from '../api/tasks.api';

export function useMarkAsDone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAsDone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
