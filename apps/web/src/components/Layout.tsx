import { NavLink, Outlet } from 'react-router-dom';

const links = [
  { to: '/', label: 'Sources', end: true },
  { to: '/review', label: 'Review queue' },
  { to: '/bank', label: 'Question bank' },
  { to: '/metrics', label: 'Metrics' },
];

export function Layout() {
  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="absolute left-4 top-4 z-50 -translate-y-20 rounded bg-white px-3 py-2 text-sm font-medium shadow focus:translate-y-0"
      >
        Skip to content
      </a>
      <header className="border-b border-ink-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
          <div>
            <p className="text-lg font-semibold tracking-tight">ItemForge</p>
            <p className="text-sm text-ink-600">AI-assisted question banks, with a human in the loop</p>
          </div>
          <nav aria-label="Primary">
            <ul className="flex flex-wrap gap-1">
              {links.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    end={link.end}
                    className={({ isActive }) =>
                      [
                        'inline-block rounded-md px-3 py-2 text-sm font-medium',
                        isActive ? 'bg-ink-900 text-white' : 'text-ink-800 hover:bg-ink-100',
                      ].join(' ')
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
