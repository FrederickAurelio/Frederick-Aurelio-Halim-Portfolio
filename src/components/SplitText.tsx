"use client";

import { useSprings, animated, easings } from "@react-spring/web";
import { useEffect, useRef, useState } from "react";

type SplitTextProps = {
  text?: string;
  className?: string;
  delay?: number;
  animationFrom?: { opacity: number; transform: string };
  animationTo?: { opacity: number; transform: string };
  easing?: keyof typeof easings;
  threshold?: number;
  rootMargin?: string;
  textAlign?: React.CSSProperties["textAlign"];
  onLetterAnimationComplete?: () => void;
};

export default function SplitText({
  text = "",
  className = "",
  delay = 100,
  animationFrom = { opacity: 0, transform: "translate3d(0,40px,0)" },
  animationTo = { opacity: 1, transform: "translate3d(0,0,0)" },
  easing = "easeOutCubic" as keyof typeof easings,
  threshold = 0.1,
  rootMargin = "-100px",
  textAlign = "center",
  onLetterAnimationComplete,
}: SplitTextProps) {
  const letters = text.split("");
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);
  const animatedCount = useRef(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(element);
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  const springProps = letters.map((_, i) => ({
    from: animationFrom,
    to: inView
      ? async (next: (props: typeof animationTo) => Promise<void>) => {
          await next(animationTo);
          animatedCount.current += 1;
          if (
            animatedCount.current === letters.length &&
            onLetterAnimationComplete
          ) {
            onLetterAnimationComplete();
          }
        }
      : animationFrom,
    delay: i * delay,
    config: { easing: easings[easing] },
  }));

  const springs = useSprings(letters.length, springProps as never);

  return (
    <p
      ref={ref}
      className={`split-parent inline overflow-hidden ${className}`}
      style={{ textAlign }}
    >
      {springs.map((props, index) => (
        <animated.span
          key={index}
          style={props as React.CSSProperties}
          className="inline-block transform transition-opacity will-change-transform"
        >
          {letters[index] === " " ? "\u00a0" : letters[index]}
        </animated.span>
      ))}
    </p>
  );
}
