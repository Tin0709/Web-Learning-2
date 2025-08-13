import React from "react";
import Scene from "./Scene.jsx";
import ChoiceButton from "./ChoiceButton.jsx";
import { useKey } from "./hooks.js";

export default function StoryEngine({ story, onSave, initialState }) {
  const [id, setId] = React.useState(initialState?.id ?? story.start);
  const [visited, setVisited] = React.useState(
    new Set(initialState?.visited ?? [])
  );
  const [activeChoice, setActiveChoice] = React.useState(0);
  const node = story.nodes[id];

  const total = Object.keys(story.nodes).length;
  const progress = Math.round((visited.size / total) * 100);

  React.useEffect(() => {
    if (!visited.has(id)) {
      setVisited((prev) => new Set(prev).add(id));
    }
    onSave?.({ id, visited: Array.from(visited), progress });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useKey(
    (e) => {
      if (!node.choices || node.choices.length === 0) return;
      if (["ArrowDown", "KeyS", "ArrowRight"].includes(e.code)) {
        setActiveChoice((c) => (c + 1) % node.choices.length);
      }
      if (["ArrowUp", "KeyW", "ArrowLeft"].includes(e.code)) {
        setActiveChoice(
          (c) => (c - 1 + node.choices.length) % node.choices.length
        );
      }
      if (["Enter", "Space"].includes(e.code)) {
        const next = node.choices[activeChoice].to;
        handleGoto(next);
      }
    },
    [node, activeChoice]
  );

  function handleGoto(nextId) {
    setActiveChoice(0);
    setId(nextId);
  }

  const isEnd = !!node.end;

  return (
    <div className="engine">
      <Scene node={node} onNext={() => handleGoto(story.start)} />
      <div className="choices" role="listbox" aria-label="Choices">
        {node.choices?.map((c, i) => (
          <ChoiceButton
            key={c.to + c.text}
            onClick={() => handleGoto(c.to)}
            isActive={i === activeChoice}
            onFocus={() => setActiveChoice(i)}
          >
            {c.text}
          </ChoiceButton>
        ))}
        {(!node.choices || node.choices.length === 0) && isEnd && (
          <div className="ending">
            <p className="ending__badge">{node.endingName || "Ending"}</p>
            <p className="ending__desc">
              {node.endingDesc || "You reached an ending."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
