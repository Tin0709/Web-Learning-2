import React from "react";

export default function Header({ onReset, hasSave }) {
  return (
    <header className="header">
      <div className="header__inner">
        <h1 className="logo" aria-label="Interactive Story Game">
          <span className="logo__dot" aria-hidden>
            ●
          </span>
          StoryWeaver
        </h1>
        <nav className="nav">
          <button
            className="btn btn--ghost"
            onClick={onReset}
            disabled={!hasSave}
            title={hasSave ? "Clear saved progress" : "No save yet"}
          >
            New Game
          </button>
          <a
            className="btn btn--primary"
            href="https://github.com/"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}
