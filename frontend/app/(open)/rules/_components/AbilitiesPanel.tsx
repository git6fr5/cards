import RajaSection from '@/components/layout/RajaSection';
import AbilityExample from './AbilityExample';
import TabGroup from './TabGroup';
import { BOTH_KINGS } from './BoardState';
import type { SequenceStep } from './AbilityExample';

interface Ability {
  label: string;
  dsl: string[];
  trigger: string;
  effect: string;
  target: string;
  sequence: SequenceStep[];
  resultSentence: string;
}

const ABILITIES: Ability[] = [
  {
    label: 'Goblin Warrior',
    dsl: ['ON PROMOTION', 'KILL', 'ENEMY CROSS:1'],
    trigger: 'Fires when this piece reaches the far rank and promotes.',
    effect: 'Kills the target outright.',
    target: 'One enemy piece on an adjacent square, cross pattern, distance 1.',
    sequence: [
      { kind: 'board', marks: [...BOTH_KINGS, { row: 5, col: 3, type: 'piece', role: 'focus', owner: 'gold' }, { row: 6, col: 3, type: 'arrow', direction: '↓' }, { row: 6, col: 4, type: 'piece', role: 'other', owner: 'silver' }], caption: 'Moves' },
      { kind: 'board', marks: [...BOTH_KINGS, { row: 6, col: 3, type: 'piece', role: 'focus', owner: 'gold', emphasized: true }, { row: 6, col: 4, type: 'piece', role: 'other', owner: 'silver' }], caption: 'Promotes' },
      { kind: 'board', marks: [...BOTH_KINGS, { row: 6, col: 3, type: 'piece', role: 'focus', owner: 'gold', emphasized: true, pulse: true }, { row: 6, col: 4, type: 'piece', role: 'other', owner: 'silver' }], caption: 'Triggers' },
      { kind: 'board', marks: [...BOTH_KINGS, { row: 6, col: 3, type: 'piece', role: 'focus', owner: 'gold', emphasized: true }, { row: 6, col: 4, type: 'killed' }], caption: 'Resolves' },
    ],
    resultSentence: 'When this piece promotes, it kills one adjacent enemy.',
  },
  {
    label: 'Goblin Bomber',
    dsl: ['ON MOVE 3', 'KILL', 'ANY CROSS:1'],
    trigger: 'Fires every 3rd time this piece moves.',
    effect: 'Kills the target outright.',
    target: 'One piece on an adjacent square, friend or foe, cross pattern, distance 1.',
    sequence: [
      { kind: 'board', marks: [...BOTH_KINGS, { row: 3, col: 1, type: 'piece', role: 'focus', owner: 'gold' }, { row: 3, col: 2, type: 'arrow', direction: '→' }, { row: 3, col: 4, type: 'piece', role: 'other', owner: 'silver' }], caption: 'Moves 1 of 3' },
      { kind: 'board', marks: [...BOTH_KINGS, { row: 3, col: 2, type: 'piece', role: 'focus', owner: 'gold' }, { row: 3, col: 3, type: 'arrow', direction: '→' }, { row: 3, col: 4, type: 'piece', role: 'other', owner: 'silver' }], caption: 'Moves 2 of 3' },
      { kind: 'board', marks: [...BOTH_KINGS, { row: 3, col: 3, type: 'piece', role: 'focus', owner: 'gold', pulse: true }, { row: 3, col: 4, type: 'piece', role: 'other', owner: 'silver' }], caption: 'Moves 3 of 3' },
      { kind: 'board', marks: [...BOTH_KINGS, { row: 3, col: 3, type: 'piece', role: 'focus', owner: 'gold' }, { row: 3, col: 4, type: 'killed' }], caption: 'Resolves' },
    ],
    resultSentence: 'Every 3rd move, this piece kills whatever sits next to it, even one of its own pieces.',
  },
  {
    label: 'Goblin Pit',
    dsl: ['ON ACTIVATE', 'MODIFY ACTION_COUNT -∞ TURNS 3', 'DEFENDER'],
    trigger: 'Fires when a player activates this building.',
    effect: "Removes the target's remaining actions for 3 turns.",
    target: "Whichever piece the player's activation targeted.",
    sequence: [
      { kind: 'board', marks: [...BOTH_KINGS, { row: 2, col: 2, type: 'piece', role: 'focus', owner: 'gold' }, { row: 2, col: 3, type: 'piece', role: 'other', owner: 'silver' }], caption: 'Activates' },
      { kind: 'board', marks: [...BOTH_KINGS, { row: 2, col: 2, type: 'piece', role: 'focus', owner: 'gold', pulse: true }, { row: 2, col: 3, type: 'piece', role: 'other', owner: 'silver' }], caption: 'Targets defender' },
      { kind: 'board', marks: [...BOTH_KINGS, { row: 2, col: 2, type: 'piece', role: 'focus', owner: 'gold' }, { row: 2, col: 3, type: 'piece', role: 'other', owner: 'silver', dimmed: true }], caption: 'Resolves' },
    ],
    resultSentence: 'Activating this building stuns an adjacent enemy for 3 turns, during which it cannot move or activate.',
  },
  {
    label: 'Goblin Cheerleader',
    dsl: ['ON MOVE 3', 'MODIFY ACTION_COUNT +1 TURNS 1', 'FRIENDLY SQUARE:1 ALL WHERE GOBLIN'],
    trigger: 'Fires every 3rd time this piece moves.',
    effect: 'Grants each target 1 extra action for 1 turn.',
    target: 'Every friendly Goblin on an adjacent square, square pattern, distance 1.',
    sequence: [
      { kind: 'board', marks: [...BOTH_KINGS, { row: 3, col: 1, type: 'piece', role: 'focus', owner: 'gold' }, { row: 3, col: 2, type: 'arrow', direction: '→' }, { row: 2, col: 3, type: 'piece', role: 'other', owner: 'gold' }, { row: 4, col: 3, type: 'piece', role: 'other', owner: 'gold' }], caption: 'Moves 1 of 3' },
      { kind: 'board', marks: [...BOTH_KINGS, { row: 3, col: 2, type: 'piece', role: 'focus', owner: 'gold' }, { row: 3, col: 3, type: 'arrow', direction: '→' }, { row: 2, col: 3, type: 'piece', role: 'other', owner: 'gold' }, { row: 4, col: 3, type: 'piece', role: 'other', owner: 'gold' }], caption: 'Moves 2 of 3' },
      { kind: 'board', marks: [...BOTH_KINGS, { row: 3, col: 3, type: 'piece', role: 'focus', owner: 'gold', pulse: true }, { row: 2, col: 3, type: 'piece', role: 'other', owner: 'gold' }, { row: 4, col: 3, type: 'piece', role: 'other', owner: 'gold' }], caption: 'Moves 3 of 3' },
      { kind: 'board', marks: [...BOTH_KINGS, { row: 3, col: 3, type: 'piece', role: 'focus', owner: 'gold' }, { row: 2, col: 3, type: 'piece', role: 'other', owner: 'gold', emphasized: true }, { row: 4, col: 3, type: 'piece', role: 'other', owner: 'gold', emphasized: true }], caption: 'Resolves' },
    ],
    resultSentence: 'Every 3rd move, every friendly Goblin standing next to this piece gains 1 extra action for a turn.',
  },
  {
    label: 'Dragon King',
    dsl: ['ON KILL', 'MODIFY SUMMON_COST -1 TURNS 99', 'FRIENDLY SHELF:1 WHERE DRAGON'],
    trigger: 'Fires whenever any of your pieces gets a kill. Every trigger on your army fires a second time on your King.',
    effect: "Reduces the target's summon cost by 1 for 99 turns, effectively permanent.",
    target: 'One random Dragon from your shelf.',
    sequence: [
      { kind: 'board', marks: [...BOTH_KINGS, { row: 2, col: 5, type: 'piece', role: 'other', owner: 'gold' }, { row: 2, col: 6, type: 'killed' }], caption: 'A piece kills' },
      { kind: 'board', marks: [{ row: 3, col: 0, type: 'piece', role: 'king', owner: 'gold', pulse: true }, { row: 3, col: 6, type: 'piece', role: 'king', owner: 'silver' }], caption: 'Notifies King' },
      { kind: 'chip', text: '-1 cost', caption: 'Shelf discount' },
    ],
    resultSentence: 'Every kill by any of your pieces permanently discounts a random Dragon on your shelf by 1 mana.',
  },
];

export default function AbilitiesPanel() {
  return (
    <RajaSection className="flex flex-col gap-3 border border-raja-chrome-border p-6">
      <h2 className="font-serif text-xl font-bold text-raja-chrome-text">Abilities</h2>
      <p className="font-sans-serif text-sm text-raja-chrome-muted">
        Every ability is a trigger, an effect, and a target. These 5 real abilities go from simplest to most complex.
      </p>
      <TabGroup
        tabs={ABILITIES.map((ability) => ({
          label: ability.label,
          content: (
            <AbilityExample
              dsl={ability.dsl}
              trigger={ability.trigger}
              effect={ability.effect}
              target={ability.target}
              sequence={ability.sequence}
              resultSentence={ability.resultSentence}
            />
          ),
        }))}
      />
    </RajaSection>
  );
}
