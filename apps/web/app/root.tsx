import {
  Links,
  Meta,
  NavLink,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import "./app.css";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="antialiased">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen bg-white text-neutral-900">
        <nav className="border-b border-neutral-100">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
            <NavLink to="/" className="text-lg font-semibold tracking-tight">
              Patrick
            </NavLink>
            <div className="flex gap-6 text-sm text-neutral-500">
              <NavLink
                to="/experience"
                className={({ isActive }) =>
                  isActive ? "text-neutral-900" : "hover:text-neutral-900"
                }
              >
                Experience
              </NavLink>
              <NavLink
                to="/projects"
                className={({ isActive }) =>
                  isActive ? "text-neutral-900" : "hover:text-neutral-900"
                }
              >
                Projects
              </NavLink>
              <NavLink
                to="/chat"
                className={({ isActive }) =>
                  isActive ? "text-neutral-900" : "hover:text-neutral-900"
                }
              >
                Chat
              </NavLink>
            </div>
          </div>
        </nav>
        <main className="mx-auto max-w-3xl px-6 py-12">{children}</main>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
