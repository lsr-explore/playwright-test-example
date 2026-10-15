import { pages } from "./pages/registry";
export function App() {
  const current = pages.find((page) => page.path === window.location.pathname);
  const Page = current?.component;
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <a className="brand" href="/" aria-label="Evergreen Banking home">
          <span aria-hidden="true">✳</span> evergreen<span className="brand-label">BANKING</span>
        </a>
        <nav aria-label="Main navigation">
          {pages.map((page) => (
            <a
              key={page.path}
              href={page.path}
              aria-current={current === page ? "page" : undefined}
            >
              {page.title}
            </a>
          ))}
        </nav>
        <span className="avatar" aria-label="Jane Brooks">
          JB
        </span>
      </header>
      <main id="main">
        {Page ? (
          <Page />
        ) : (
          <>
            <h1>Page not found</h1>
            <a href="/">Return to overview</a>
          </>
        )}
      </main>
      <footer>Evergreen Banking · A demo with illustrative account data.</footer>
    </>
  );
}
