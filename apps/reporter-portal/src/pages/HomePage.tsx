import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <>
      <header className="topbar shell">
        <Link className="brand-lockup" to="/">
          <img alt="Solstice Ventures Holding" src="/brand/svh-logo-horizontal.png" />
        </Link>

        <nav className="topnav">
          <a href="#reporting">Reporting channel</a>
          <Link to="/track">Track case</Link>
          <a href="#privacy">Privacy</a>
        </nav>
      </header>

      <main className="shell">
        <section className="hero hero-faceup">
          <div className="hero-mark">
            <img
              alt="SVH brand gradient"
              className="hero-mark-image"
              src="/brand/svh-gradient-mark.png"
            />
          </div>

          <div className="hero-copy hero-copy-centered">
            <p className="eyebrow">SVH SpeakUp</p>
            <h1>Reporting channel</h1>
            <p className="lede">
              Use this channel to safely report concerns, misconduct, or
              unethical behavior. It covers SVH and its ventures.
            </p>
            <div className="actions actions-centered">
              <Link className="button primary" to="/report">
                Start a report
              </Link>
              <Link className="button secondary" to="/track">
                Track existing case
              </Link>
              <a className="button secondary" href="#privacy">
                How confidentiality works
              </a>
            </div>
          </div>
        </section>

        <section className="simple-info-grid" id="reporting">
          <article className="simple-card">
            <h2>What happens next</h2>
            <ul className="check-list compact">
              <li>Your report is submitted securely.</li>
              <li>You receive a case ID and secret.</li>
              <li>You can return later for follow-up.</li>
            </ul>
          </article>
          <article className="simple-card">
            <h2>Covered entities</h2>
            <p>This channel covers SVH and 4 ventures.</p>
            <div className="venture-tags" aria-label="SVH ventures">
              <span className="venture-tag">EASE</span>
              <span className="venture-tag">RRG</span>
              <span className="venture-tag">SINO</span>
              <span className="venture-tag">PAG</span>
            </div>
          </article>
        </section>

        <section className="content-panel content-panel-simple" id="privacy">
          <div className="section-head">
            <p className="eyebrow">Privacy</p>
            <h2>Keep your identity safe</h2>
          </div>
          <ul className="check-list compact">
            <li>Do not include your name unless you want to share it.</li>
            <li>Keep your case ID and secret somewhere safe.</li>
            <li>Be as clear and factual as possible.</li>
          </ul>
        </section>
      </main>
    </>
  );
}
