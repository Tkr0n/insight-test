import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchShares,
  shareTask as apiShareTask,
  unshareTask as apiUnshareTask,
} from '../api/shares.api';

export function useShares(taskId: string) {
  return useQuery({
    queryKey: ['shares', taskId],
    queryFn: () => fetchShares(taskId),
    enabled: Boolean(taskId),
  });
}

export function useShareTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, userId }: { taskId: string; userId: string }) =>
      apiShareTask(taskId, userId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shares', variables.taskId] });
    },
  });
}

export function useUnshareTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, userId }: { taskId: string; userId: string }) =>
      apiUnshareTask(taskId, userId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shares', variables.taskId] });
    },
  });
}
