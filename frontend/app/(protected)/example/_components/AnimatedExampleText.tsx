'use client';

const LETTERS = ['E', 'X', 'A', 'M', 'P', 'L', 'E'];

export default function AnimatedExampleText() {
  return (
    <div className="flex gap-px">
      {LETTERS.map((letter, index) => (
        <span
          key={index}
          className="text-4xl font-garamond font-bold text-kingkiller-gold animate-bounce"
          style={{ animationDelay: `${index * 0.12}s` }}
        >
          {letter}
        </span>
      ))}
    </div>
  );
}
