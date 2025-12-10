"use client";

import { useEffect, useState } from "react";

interface Spark {
  id: number;
  x: number;
  y: number;
}

let sparkId = 0;

export default function ClickSparkProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sparks, setSparks] = useState<Spark[]>([]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const newSpark: Spark = {
        id: sparkId++,
        x: e.clientX,
        y: e.clientY,
      };
      setSparks((prev) => [...prev, newSpark]);

      setTimeout(() => {
        setSparks((prev) => prev.filter((s) => s.id !== newSpark.id));
      }, 500);
    };

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  return (
    <>
      {children}
      <div className="pointer-events-none fixed inset-0 z-[70]">
        {sparks.map((spark) => (
          <span
            key={spark.id}
            className="click-spark"
            style={{ left: spark.x, top: spark.y }}
          />
        ))}
      </div>
    </>
  );
}
