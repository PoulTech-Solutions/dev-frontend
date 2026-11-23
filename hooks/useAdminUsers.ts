import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  confirmInternalUser,
  deleteInternalUser,
  listInternalUsers,
  setInternalUserActive,
  startInternalUser,
  type InternalRole,
} from "../services/adminService";
import { canListDirectory } from "../utils/permissions";
import { useAuthStore } from "../store/useAuthStore";

const DIRECTORY_PAGE_SIZE = 20;

export function useAdminUsers(enabled = true) {
  const backendRole = useAuthStore((state) => state.user?.backendRole);
  const canFetch = enabled && canListDirectory(backendRole);

  return useInfiniteQuery({
    queryKey: ["admin", "users"],
    queryFn: ({ pageParam }) => listInternalUsers({ limit: DIRECTORY_PAGE_SIZE, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.has_more ? last.offset + last.items.length : undefined),
    enabled: canFetch,
    staleTime: 15_000,
  });
}

export function useStartInternalUser() {
  return useMutation({
    mutationFn: (body: {
      email: string;
      password: string;
      first_name: string;
      last_name: string;
      phone: string;
      role: InternalRole;
    }) => startInternalUser(body),
  });
}

export function useConfirmInternalUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { otp_session_id: string; otp: string; purpose?: string }) =>
      confirmInternalUser(body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useSetInternalUserActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      setInternalUserActive(userId, isActive),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useDeleteInternalUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => deleteInternalUser(userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}
