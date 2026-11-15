import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, PropsWithChildren } from "react";

/** Cliente aislado por prueba, igual que las vistas del equipo y sin persistir datos. */
export function renderWithQueryClient(
  ui: ReactElement,
  options?: RenderOptions,
) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });
  const OriginalWrapper = options?.wrapper;
  function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={client}>
        {OriginalWrapper ? (
          <OriginalWrapper>{children}</OriginalWrapper>
        ) : (
          children
        )}
      </QueryClientProvider>
    );
  }
  return render(ui, { ...options, wrapper: Wrapper });
}
