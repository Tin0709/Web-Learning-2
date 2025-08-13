import { useEffect, useRef, useState } from "react";

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      if (value === null || value === undefined) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch {
      /* ignore */
    }
  }, [key, value]);

  return [value, setValue];
}

export function useKey(handler) {
  const handlerRef = useRef(handler);

  // keep ref synced with latest handler
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  // add/remove listener once; always call latest handler via ref
  useEffect(() => {
    const fn = (e) => handlerRef.current(e);
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);
}

export function useTypewriter(text, speed = 18) {
  const [output, setOutput] = useState("");
  const indexRef = useRef(0);
  const stopRef = useRef(false);

  useEffect(() => {
    indexRef.current = 0;
    setOutput("");
    stopRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (stopRef.current) {
      setOutput(text);
      return;
    }
    const id = setInterval(() => {
      indexRef.current += 1;
      setOutput(text.slice(0, indexRef.current));
      if (indexRef.current >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  return output;
}
