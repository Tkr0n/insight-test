import { useQuery } from '@tanstack/react-query';
import { fetchUsers } from '../api/users.api';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });
}
