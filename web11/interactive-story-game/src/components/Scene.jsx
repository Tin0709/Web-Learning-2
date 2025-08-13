import React from "react";
import { useTypewriter } from "./hooks.js";

export default function Scene({ node, onNext }) {
  const output = useTypewriter(node.text, 14);
  return (
    <section className="scene">
      <div className="scene__card">
        <div className="scene__bg" aria-hidden></div>
        <p className="scene__text">{output}</p>
        {node.choices?.length === 0 && node.end && (
          <button className="btn btn--primary scene__restart" onClick={onNext}>
            Play again
          </button>
        )}
      </div>
    </section>
  );
}
