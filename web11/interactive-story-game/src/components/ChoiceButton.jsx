import React from "react";

export default function ChoiceButton({ children, onClick, isActive, onFocus }) {
  return (
    <button
      className={"choice " + (isActive ? "choice--active" : "")}
      onClick={onClick}
      onFocus={onFocus}
    >
      <span className="choice__chevron" aria-hidden>
        ›
      </span>
      {children}
    </button>
  );
}
