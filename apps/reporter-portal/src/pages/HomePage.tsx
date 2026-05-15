import { Link } from "react-router-dom";
import { LanguageToggle } from "../components/LanguageToggle";
import { useLanguage } from "../i18n";

export function HomePage() {
  const { t } = useLanguage();

  return (
    <>
      <header className="topbar shell">
        <Link className="brand-lockup" to="/">
          <img alt="Solstice Ventures Holding" src="/brand/svh-logo-horizontal.png" />
        </Link>

        <nav className="topnav">
          <a href="#reporting">{t("nav.reporting")}</a>
          <Link to="/track">{t("nav.track")}</Link>
          <a href="#privacy">{t("nav.privacy")}</a>
          <LanguageToggle />
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
            <p className="eyebrow">{t("home.eyebrow")}</p>
            <h1>{t("home.title")}</h1>
            <p className="lede">
              {t("home.lede")}
            </p>
            <div className="actions actions-centered">
              <Link className="button primary" to="/report">
                {t("home.startReport")}
              </Link>
              <Link className="button secondary" to="/track">
                {t("home.trackExisting")}
              </Link>
              <a className="button secondary" href="#privacy">
                {t("home.confidentiality")}
              </a>
            </div>
          </div>
        </section>

        <section className="simple-info-grid" id="reporting">
          <article className="simple-card">
            <h2>{t("home.next.title")}</h2>
            <ul className="check-list compact">
              <li>{t("home.next.item1")}</li>
              <li>{t("home.next.item2")}</li>
              <li>{t("home.next.item3")}</li>
            </ul>
          </article>
          <article className="simple-card">
            <h2>{t("home.covered.title")}</h2>
            <p>{t("home.covered.copy")}</p>
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
            <p className="eyebrow">{t("home.privacy.eyebrow")}</p>
            <h2>{t("home.privacy.title")}</h2>
          </div>
          <ul className="check-list compact">
            <li>{t("home.privacy.item1")}</li>
            <li>{t("home.privacy.item2")}</li>
            <li>{t("home.privacy.item3")}</li>
          </ul>
        </section>
      </main>
    </>
  );
}
