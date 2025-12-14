"use client";

import { useCallback, useRef, useTransition } from "react";

export type MutationState = "idle" | "pending" | "success" | "error";

export interface OptimisticMutationOptions<TData, TVariables, TContext> {
  /**
   * Called before mutation inside startTransition — return context for rollback
   * IMPORTANT: This runs inside startTransition, so useOptimistic updates work here
   */
  onMutate?: (variables: TVariables) => TContext | Promise<TContext>;

  /**
   * The actual mutation function
   */
  mutationFn: (variables: TVariables) => Promise<TData>;

  /**
   * Called on success with server response
   */
  onSuccess?: (data: TData, variables: TVariables, context: TContext) => void;

  /**
   * Called on error — use context to rollback
   */
  onError?: (error: Error, variables: TVariables, context: TContext) => void;

  /**
   * Always called after mutation (success or error)
   */
  onSettled?: (
    data: TData | undefined,
    error: Error | null,
    variables: TVariables,
    context: TContext
  ) => void;
}

/**
 * Senior-level optimistic mutation hook for React 19
 *
 * Pattern inspired by TanStack Query but lightweight for Next.js 16 + React 19
 *
 * Features:
 * - Optimistic updates with automatic rollback on error
 * - Pending state tracking via useTransition
 * - Type-safe context for rollback
 * - No external dependencies
 * - Compatible with React 19 useOptimistic (runs inside startTransition)
 */
export function useOptimisticMutation<
  TData = unknown,
  TVariables = void,
  TContext = unknown
>(options: OptimisticMutationOptions<TData, TVariables, TContext>) {
  const [isPending, startTransition] = useTransition();
  const contextRef = useRef<TContext | null>(null);
  const resultRef = useRef<{ data?: TData; error: Error | null }>({ error: null });

  const mutate = useCallback(
    (variables: TVariables) => {
      // Reset result
      resultRef.current = { error: null };

      // Everything runs inside startTransition for React 19 useOptimistic compatibility
      startTransition(async () => {
        let context: TContext = undefined as TContext;

        try {
          // 1. Optimistic update (inside transition!)
          if (options.onMutate) {
            context = await options.onMutate(variables);
            contextRef.current = context;
          }

          // 2. Execute mutation
          const data = await options.mutationFn(variables);
          resultRef.current.data = data;

          // 3. Success callback
          if (options.onSuccess) {
            options.onSuccess(data, variables, context);
          }

          // 4. Settled callback (success)
          if (options.onSettled) {
            options.onSettled(data, null, variables, context);
          }
        } catch (e) {
          const error = e instanceof Error ? e : new Error(String(e));
          resultRef.current.error = error;

          // 5. Error callback — rollback here
          if (options.onError) {
            options.onError(error, variables, context);
          }

          // 6. Settled callback (error)
          if (options.onSettled) {
            options.onSettled(undefined, error, variables, context);
          }
        }
      });
    },
    [options]
  );

  return {
    mutate,
    isPending,
  };
}
