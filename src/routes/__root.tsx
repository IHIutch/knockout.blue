import { TanStackDevtools } from '@tanstack/react-devtools'
import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

import { AuthButton } from '../components/AuthButton'
import { Header } from '../components/Header'
import { AuthProvider } from '../hooks/useAuth'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'bracket.blue — World Cup 2026 bracket picks' },
      {
        name: 'description',
        content:
          'Predict the 2026 World Cup knockout bracket and publish your picks to your own AT Protocol account.',
      },
      { name: 'theme-color', content: '#09090b' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
  component: RootLayout,
})

// eslint-disable-next-line react-refresh/only-export-components
function RootLayout() {
  return (
    <AuthProvider>
      <Header>
        <AuthButton />
      </Header>
      <Outlet />
    </AuthProvider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-dvh bg-zinc-950 text-zinc-100 antialiased">
        {children}
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
