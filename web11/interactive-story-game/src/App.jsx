import React from "react";
import Header from "./components/Header.jsx";
import StoryEngine from "./components/StoryEngine.jsx";
import ProgressBar from "./components/ProgressBar.jsx";
import { useLocalStorage } from "./components/hooks.js";
import story from "./story.js";

export default function App() {
  const [save, setSave] = useLocalStorage("story-save", null);
  const [showToast, setShowToast] = React.useState(false);

  const handleSave = (data) => {
    setSave(data);
    setShowToast(true);
    window.clearTimeout(window.__toastTimer);
    window.__toastTimer = window.setTimeout(() => setShowToast(false), 1500);
  };

  const handleReset = () => setSave(null);

  return (
    <div className="app-shell">
      <Header onReset={handleReset} hasSave={!!save} />
      <main className="container">
        <ProgressBar percent={save?.progress ?? 0} />
        <StoryEngine
          key={save?.id || "fresh"}
          story={story}
          initialState={save}
          onSave={handleSave}
        />
      </main>

      <div
        className={"toast " + (showToast ? "toast--visible" : "")}
        role="status"
        aria-live="polite"
      >
        Progress saved ✓
      </div>
    </div>
  );
}
