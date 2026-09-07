import { useEffect, useRef, useState } from 'react';

const PROMPTS = [
  'Do you remember that time when…?',
  'Have you ever seen that show where…?',
  'Have you ever heard that song where…?',
  'Do you know that character / person who…?',
  'Do you remember the person who…?',
  'Do you remember that place near...?',
  'Have you eaten at that place where...?',
  'Do you remember that meme where...?',
  'Have you ever read that book where...?',
  'Do you remember that weird trend from...?',
  'Have you ever played that game where...?',
  'Do you know that sound that happens when…?',
  'Do you remember the news story about...?',
  'Do you remember that ad that went like...?',
  'Do you remember what they wore to...?',
  'Do you know that thing that looks like…?',
  'Do you remember that dish that tasted like…?',
  'A few years ago, there was that thing…?',
  'You know how there\'s this concept of…?',
  'You know how there\'s plans to…?',
];

const ACCENT_COLORS = [
  'var(--brand-red)',
  'var(--brand-orange)',
  'var(--brand-teal)',
  'var(--brand-green)',
];

function pickRandom<T>(items: T[], exclude?: T): T {
  const pool = exclude === undefined ? items : items.filter((item) => item !== exclude);
  return pool[Math.floor(Math.random() * pool.length)] ?? items[0];
}

export function ThoughtfulPrompts() {
  const initialColor = pickRandom(ACCENT_COLORS);
  const [prompt, setPrompt] = useState(() => pickRandom(PROMPTS));
  const [baseColor, setBaseColor] = useState(initialColor);
  const [accentColor, setAccentColor] = useState(initialColor);
  const [wipeKey, setWipeKey] = useState(0);
  const [textVisible, setTextVisible] = useState(true);
  const accentRef = useRef(accentColor);

  useEffect(() => {
    accentRef.current = accentColor;
  }, [accentColor]);

  useEffect(() => {
    let fadeTimeout: ReturnType<typeof setTimeout> | undefined;

    const interval = setInterval(() => {
      setTextVisible(false);
      fadeTimeout = setTimeout(() => {
        setPrompt((current) => pickRandom(PROMPTS, current));
        setBaseColor(accentRef.current);
        setAccentColor((current) => pickRandom(ACCENT_COLORS, current));
        setWipeKey((key) => key + 1);
        setTextVisible(true);
      }, 400);
    }, 5000);

    return () => {
      clearInterval(interval);
      if (fadeTimeout) clearTimeout(fadeTimeout);
    };
  }, []);

  return (
    <div className="thoughtful-prompts">
      <div className="thoughtful-prompts-bar" aria-hidden>
        <div className="thoughtful-prompts-bar-base" style={{ backgroundColor: baseColor }} />
        {wipeKey > 0 && (
          <div
            key={wipeKey}
            className="thoughtful-prompts-bar-wipe"
            style={{ backgroundColor: accentColor }}
          />
        )}
      </div>
      <p className={`thoughtful-prompts-text ${textVisible ? 'is-visible' : ''}`}>{prompt}</p>
    </div>
  );
}
