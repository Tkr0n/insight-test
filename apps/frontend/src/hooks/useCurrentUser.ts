import { useQuery } from '@tanstack/react-query';
import { fetchMe } from '../api/auth.api';

export function useCurrentUser() {
  return useQuery({
    queryKey: ['me'],
    queryFn: fetchMe,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}
