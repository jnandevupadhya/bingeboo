import { useEffect, useState } from "react";

export default function ChristmasDecorations() {
  const [showDecorations, setShowDecorations] = useState(false);

  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed
    const day = now.getDate();

    // Show decorations from Dec 1 to Jan 7
    const isDecember = month === 11; // December
    const isEarlyJanuary = month === 0 && day <= 7; // Jan 1-7

    setShowDecorations(isDecember || isEarlyJanuary);
  }, []);

  if (!showDecorations) return null;

  return (
    <>
      {/* Twinkling stars */}
      <div className="christmas-star" />
      <div className="christmas-star" />
      <div className="christmas-star" />
      <div className="christmas-star" />
      <div className="christmas-star" />
      <div className="christmas-star" />
      <div className="christmas-star" />
      <div className="christmas-star" />

      {/* Falling snowflakes */}
      <div className="snowflake">❄</div>
      <div className="snowflake">✦</div>
      <div className="snowflake">❄</div>
      <div className="snowflake">✧</div>
      <div className="snowflake">❄</div>
      <div className="snowflake">✦</div>
      <div className="snowflake">❄</div>
    </>
  );
}
