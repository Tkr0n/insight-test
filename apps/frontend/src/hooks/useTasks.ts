import { useQuery } from '@tanstack/react-query';
import { fetchTasks } from '../api/tasks.api';
import type { Task } from '../types/task';

export function useTasks() {
  return useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  });
}
