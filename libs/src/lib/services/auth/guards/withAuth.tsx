// libs/shell/src/lib/services/auth/guards/with-auth.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, ComponentType, useState } from 'react';
import { useAuthState } from '../hooks';

/**
 * Higher Order Component (HOC) for protecting routes in Next.js App Router
 * @param Component The component to wrap with authentication protection
 * @param options Configuration options
 * @returns Protected component
 */
export function withAuth<P extends object>(
  Component: ComponentType<P>,
  options: {
    redirectTo?: string;
    redirectIfAuthenticated?: boolean;
    appUrl?: string;
  } = {}
) {
  const {
    redirectTo = '/login',
    redirectIfAuthenticated = false,
    appUrl,
  } = options;

  return function ProtectedComponent(props: P) {
    const router = useRouter();
    const { isAuthenticated, loading } = useAuthState();
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
      if (!loading) {
        // For protected routes (default case)
        if (!redirectIfAuthenticated && !isAuthenticated) {
          if (appUrl) {
            // Redirect to another app's login page
            window.location.href = `${appUrl}${redirectTo}`;
          } else {
            // Redirect within the same app
            router.push(redirectTo);
          }
        }

        // For public routes that should redirect if user is already authenticated
        if (redirectIfAuthenticated && isAuthenticated) {
          router.push(redirectTo);
        }

        // If we've passed all redirect conditions, we should render the component
        setShouldRender(
          (redirectIfAuthenticated && !isAuthenticated) || 
          (!redirectIfAuthenticated && isAuthenticated)
        );
      }
    }, [isAuthenticated, loading, router]);

    // Show loading state while checking authentication
    if (loading) {
      return <div>Loading...</div>;
    }

    // Render the protected component if conditions are met
    return shouldRender ? <Component {...props} /> : null;
  };
}

// Example usage of withAuth for various scenarios

/**
 * HOC for routes that require authentication (protected routes)
 * @param Component The component to protect
 * @param redirectTo Where to redirect if not authenticated
 * @returns Protected component
 */
export function withRequireAuth<P extends object>(
  Component: ComponentType<P>,
  redirectTo = '/login'
) {
  return withAuth(Component, { redirectTo });
}

/**
 * HOC for public routes that should redirect if already authenticated
 * @param Component The component to render for unauthenticated users
 * @param redirectTo Where to redirect if already authenticated
 * @returns Component that only renders for unauthenticated users
 */
export function withPublicOnly<P extends object>(
  Component: ComponentType<P>,
  redirectTo = '/dashboard'
) {
  return withAuth(Component, { redirectTo, redirectIfAuthenticated: true });
}

/**
 * HOC for routes in one app that require authentication from another app
 * @param Component The component to protect
 * @param appUrl The base URL of the auth app
 * @param redirectTo The path to redirect to in the auth app
 * @returns Protected component
 */
export function withCrossAppAuth<P extends object>(
  Component: ComponentType<P>,
  appUrl: string,
  redirectTo = '/login'
) {
  return withAuth(Component, { appUrl, redirectTo });
}

// Export all guards
