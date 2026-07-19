import BoardState from './BoardState';
import type { BoardMark } from './BoardState';

export type SequenceStep =
  | { kind: 'board'; marks: BoardMark[]; caption: string }
  | { kind: 'chip'; text: string; caption: string };

interface AbilityExampleProps {
  dsl: string[];
  trigger: string;
  effect: string;
  target: string;
  sequence: SequenceStep[];
  resultSentence: string;
}

export default function AbilityExample({ dsl, trigger, effect, target, sequence, resultSentence }: AbilityExampleProps) {
  const fields = [
    { label: 'Trigger', value: trigger },
    { label: 'Effect', value: effect },
    { label: 'Target', value: target },
  ];

  return (
    <div className="flex flex-col gap-4">
      <ol className="flex list-none flex-wrap items-start gap-8">
        {fields.map((field, i) => (
          <li key={field.label} className="flex flex-col gap-1">
            <span className="font-monospace text-xs uppercase tracking-wide text-raja-chrome-muted">{i + 1}. {field.label}</span>
            <span className="font-sans-serif text-sm text-raja-chrome-text">{field.value}</span>
          </li>
        ))}
      </ol>
      <div className="flex flex-col gap-3 border-t border-raja-chrome-border pt-4">
        <div className="flex flex-col font-monospace text-xs text-raja-chrome-action">
          {dsl.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </div>
        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          {sequence.map((step, i) => (
            <div key={step.caption} className="flex shrink-0 items-center gap-3">
              {step.kind === 'board' ? (
                <BoardState marks={step.marks} caption={`${i + 1}. ${step.caption}`} />
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <div className="flex h-6 items-center justify-center border border-raja-chrome-border px-2">
                    <span className="font-monospace text-xs text-raja-chrome-action">{step.text}</span>
                  </div>
                  <span className="font-monospace text-xs uppercase tracking-wide text-raja-chrome-muted">{i + 1}. {step.caption}</span>
                </div>
              )}
              {i < sequence.length - 1 && <span className="font-sans-serif text-raja-chrome-muted">→</span>}
            </div>
          ))}
        </div>
        <span className="font-sans-serif text-sm text-raja-chrome-muted">{resultSentence}</span>
      </div>
    </div>
  );
}
