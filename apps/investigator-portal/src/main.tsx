import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";

function App() {
  return (
    <main className="shell">
      <section className="panel">
        <p className="eyebrow">Investigator portal</p>
        <h1>Secure case management will live here.</h1>
        <p>
          This app is reserved for authenticated investigators. The next slice
          after reporter submission is the case inbox, case detail view, and
          workflow actions.
        </p>
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
