import React from "react";

export default function ProgressBar({ percent }) {
  const safe = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div className="progress" aria-label="Progress">
      <div
        className="progress__bar"
        style={{ width: `${safe}%` }}
        aria-valuenow={safe}
        aria-valuemin={0}
        aria-valuemax={100}
        role="progressbar"
      />
      <span className="progress__text">{safe}%</span>
    </div>
  );
}
