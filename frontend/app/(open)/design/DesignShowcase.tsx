'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import KingkillerButton from '@/components/forms/KingkillerButton';
import KingkillerTextField from '@/components/forms/KingkillerTextField';
import KingkillerTextArea from '@/components/forms/KingkillerTextArea';
import KingkillerDropdown from '@/components/forms/KingkillerDropdown';
import KingkillerCheckbox from '@/components/forms/KingkillerCheckbox';
import KingkillerRadio from '@/components/forms/KingkillerRadio';
import KingkillerDatePicker from '@/components/forms/KingkillerDatePicker';
import KingkillerFileUpload from '@/components/forms/KingkillerFileUpload';
import KingkillerHeader from '@/components/layout/KingkillerHeader';
import KingkillerFooter from '@/components/layout/KingkillerFooter';
import KingkillerSection from '@/components/layout/KingkillerSection';
import KingkillerModal from '@/components/layout/KingkillerModal';
import KingkillerLoader from '@/components/layout/KingkillerLoader';

interface SwatchSpec {
  token: string;
  bg: string;
  dark?: boolean;
}

interface PaletteGroup {
  name: string;
  swatches: SwatchSpec[];
}

const PALETTE_GROUPS: PaletteGroup[] = [
  {
    name: 'Core',
    swatches: [
      { token: 'black',    bg: 'bg-kingkiller-black',    dark: true },
      { token: 'obsidian', bg: 'bg-kingkiller-obsidian', dark: true },
      { token: 'white',    bg: 'bg-kingkiller-white' },
      { token: 'hover',    bg: 'bg-kingkiller-hover' },
      { token: 'stone',    bg: 'bg-kingkiller-stone',    dark: true },
    ],
  },
  {
    name: 'Text',
    swatches: [
      { token: 'grey',       bg: 'bg-kingkiller-grey',       dark: true },
      { token: 'grey-muted', bg: 'bg-kingkiller-grey-muted' },
      { token: 'grey-light', bg: 'bg-kingkiller-grey-light' },
    ],
  },
  {
    name: 'Accents',
    swatches: [
      { token: 'gold',       bg: 'bg-kingkiller-gold' },
      { token: 'gold-light', bg: 'bg-kingkiller-gold-light' },
      { token: 'emerald',    bg: 'bg-kingkiller-emerald', dark: true },
    ],
  },
  {
    name: 'Status',
    swatches: [
      { token: 'crimson',       bg: 'bg-kingkiller-crimson',       dark: true },
      { token: 'crimson-light', bg: 'bg-kingkiller-crimson-light' },
      { token: 'amber',         bg: 'bg-kingkiller-amber',         dark: true },
      { token: 'amber-light',   bg: 'bg-kingkiller-amber-light' },
      { token: 'arcane',        bg: 'bg-kingkiller-arcane',        dark: true },
      { token: 'arcane-light',  bg: 'bg-kingkiller-arcane-light' },
    ],
  },
];

function Block({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border border-kingkiller-stone bg-kingkiller-white p-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-garamond text-2xl font-bold text-kingkiller-black">{title}</h2>
        {subtitle && <p className="text-sm text-kingkiller-grey">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 border-t border-kingkiller-grey-light pt-4 first:border-0 first:pt-0">
      <span className="text-xs font-medium uppercase tracking-wide text-kingkiller-grey">{label}</span>
      <div className="flex flex-wrap items-center gap-4">{children}</div>
    </div>
  );
}

export default function DesignShowcase() {
  const [text, setText] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [faction, setFaction] = useState('');
  const [agree, setAgree] = useState(true);
  const [rarity, setRarity] = useState('common');
  const [date, setDate] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <main className="min-h-screen bg-kingkiller-black">
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-12">
        <header className="flex flex-col gap-2">
          <div className="self-start border border-kingkiller-gold px-2 py-0.5">
            <span className="text-xs font-medium uppercase tracking-wide text-kingkiller-gold">Design System</span>
          </div>
          <h1 className="font-garamond text-3xl font-bold text-kingkiller-gold">Kingkiller Design Base</h1>
          <p className="text-sm text-kingkiller-grey-muted">
            Every shared <code className="font-mono text-kingkiller-gold">Kingkiller*</code> component, rendered live. Void + parchment palette, EB Garamond.
          </p>
        </header>

        <Block title="Palette" subtitle="Tokens defined in globals.css under @theme inline.">
          {PALETTE_GROUPS.map((group) => (
            <Row key={group.name} label={group.name}>
              <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {group.swatches.map((s) => (
                  <div key={s.token} className={`flex h-20 flex-col justify-end border border-kingkiller-grey-light p-2 ${s.bg}`}>
                    <span className={`text-xs font-medium ${s.dark ? 'text-kingkiller-white' : 'text-kingkiller-black'}`}>{s.token}</span>
                  </div>
                ))}
              </div>
            </Row>
          ))}
        </Block>

        <Block title="Typography">
          <Row label="EB Garamond">
            <div className="flex flex-col gap-2">
              <p className="font-garamond text-3xl font-bold text-kingkiller-black">The Name of the Wind</p>
              <p className="font-garamond text-xl text-kingkiller-black">Kvothe of the Edema Ruh</p>
              <p className="font-garamond text-sm text-kingkiller-grey">
                Body copy — 0.875rem. Classical serif throughout. Garamond carries the fantasy register across every surface.
              </p>
            </div>
          </Row>
        </Block>

        <Block title="KingkillerHeader" subtitle="Section heading with optional emphasised substring.">
          <Row label="Default">
            <KingkillerHeader text="The Arcane Arts" />
          </Row>
          <Row label="With em">
            <KingkillerHeader text="Challenge the Arena" em="Arena" />
          </Row>
          <Row label="Alt (on void)">
            <div className="bg-kingkiller-black p-4">
              <KingkillerHeader alt text="Challenger's Tome" />
            </div>
          </Row>
        </Block>

        <Block title="KingkillerButton" subtitle="Primary (void) and alt (parchment) variants.">
          <Row label="Action">
            <KingkillerButton variant="action" text="Play Card" />
            <KingkillerButton variant="action" alt text="Forfeit" />
            <KingkillerButton variant="action" text="Casting…" loading />
            <KingkillerButton variant="action" text="Locked" disabled />
          </Row>
          <Row label="Link">
            <KingkillerButton variant="link" href="#" text="View deck" />
            <KingkillerButton variant="link" alt href="#" text="Return" />
          </Row>
          <Row label="Full width">
            <KingkillerButton variant="action" fullWidth text="Enter the Arena" />
          </Row>
        </Block>

        <Block title="Form fields">
          <div className="grid gap-5 sm:grid-cols-2">
            <KingkillerTextField id="name" label="Card name" value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Iron Fist" />
            <KingkillerTextField id="email" label="Email (validates on blur)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@realm.com" />
            <KingkillerDropdown
              id="faction"
              label="Faction"
              value={faction}
              onChange={(e) => setFaction(e.target.value)}
              placeholder="Choose a faction"
              options={[
                { value: 'arcane', label: 'Arcane' },
                { value: 'emerald', label: 'Emerald Order' },
                { value: 'crimson', label: 'Crimson Blades' },
              ]}
            />
            <KingkillerDatePicker id="date" label="Tournament date" value={date} onChange={(e) => setDate(e.target.value)} />
            <KingkillerTextField id="err" label="With error" value="??" onChange={() => {}} error="Mana cost must be a number" />
            <KingkillerFileUpload label="Card artwork" onChange={() => {}} accept="image/*" />
          </div>
          <KingkillerTextArea id="notes" label="Card description" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Describe the card's lore and abilities…" rows={3} />
        </Block>

        <Block title="Selection controls">
          <Row label="Checkbox">
            <KingkillerCheckbox id="foil" label="Mark as foil edition" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <KingkillerCheckbox id="disabled-cb" label="Disabled" checked={false} onChange={() => {}} disabled />
          </Row>
          <Row label="Radio — card rarity">
            <KingkillerRadio
              name="rarity"
              value={rarity}
              onChange={setRarity}
              options={[
                { value: 'common', label: 'Common' },
                { value: 'uncommon', label: 'Uncommon' },
                { value: 'rare', label: 'Rare' },
                { value: 'legendary', label: 'Legendary' },
              ]}
            />
          </Row>
        </Block>

        <Block title="KingkillerLoader">
          <Row label="Sizes (on parchment)">
            <KingkillerLoader size="sm" />
            <KingkillerLoader size="md" />
            <KingkillerLoader size="lg" />
          </Row>
          <Row label="Alt (on void)">
            <div className="flex items-center gap-4 bg-kingkiller-black p-4">
              <KingkillerLoader size="sm" alt />
              <KingkillerLoader size="md" alt />
              <KingkillerLoader size="lg" alt />
            </div>
          </Row>
        </Block>

        <Block title="KingkillerModal">
          <Row label="Overlay">
            <KingkillerButton variant="action" text="Open modal" onClick={() => setModalOpen(true)} />
          </Row>
        </Block>

        <Block title="KingkillerSection" subtitle="Full-width band — default (parchment) and alt (void).">
          <div className="overflow-hidden border border-kingkiller-grey-light">
            <KingkillerSection>
              <div className="p-6">
                <KingkillerHeader text="Default section" />
                <p className="mt-1 text-sm text-kingkiller-grey">Parchment background, void text.</p>
              </div>
            </KingkillerSection>
            <KingkillerSection alt>
              <div className="p-6">
                <KingkillerHeader alt text="Alt section" />
                <p className="mt-1 text-sm text-kingkiller-grey-muted">Void background, parchment text.</p>
              </div>
            </KingkillerSection>
          </div>
        </Block>

        <Block title="KingkillerFooter">
          <KingkillerFooter alt>
            <div className="flex items-center justify-between px-6 py-4 text-sm">
              <span className="font-garamond text-kingkiller-white">Kingkiller</span>
              <span className="text-kingkiller-grey-muted">© 2026</span>
            </div>
          </KingkillerFooter>
        </Block>
      </div>

      {modalOpen && (
        <KingkillerModal
          title="Iron Fist — Legendary"
          onClose={() => setModalOpen(false)}
          footer={
            <div className="flex justify-end gap-2 p-3">
              <KingkillerButton variant="action" alt text="Close" onClick={() => setModalOpen(false)} />
              <KingkillerButton variant="action" text="Add to Deck" onClick={() => setModalOpen(false)} />
            </div>
          }
        >
          <div className="flex flex-col gap-3 p-4">
            <p className="text-sm text-kingkiller-black">
              A legendary card composes the base modal shell — title bar, scrollable body, and a footer slot for actions.
            </p>
          </div>
        </KingkillerModal>
      )}
    </main>
  );
}
