import { useQuery } from '@tanstack/react-query';
import { fetchTasks } from '../api/tasks.api';
import type { Task, TaskFilters } from '../types/task';

export function useTasks(filters?: TaskFilters) {
  return useQuery<Task[]>({
    queryKey: ['tasks', filters],
    queryFn: () => fetchTasks(filters),
  });
}
