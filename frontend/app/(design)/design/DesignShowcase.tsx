'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import RajaButton from '@/components/ui/RajaButton';
import RajaTextField from '@/components/ui/RajaTextField';
import RajaTextArea from '@/components/ui/RajaTextArea';
import RajaDropdown from '@/components/ui/RajaDropdown';
import RajaCheckbox from '@/components/ui/RajaCheckbox';
import RajaRadio from '@/components/ui/RajaRadio';
import RajaDatePicker from '@/components/ui/RajaDatePicker';
import RajaFileUpload from '@/components/ui/RajaFileUpload';
import RajaHeader from '@/components/layout/RajaHeader';
import RajaFooter from '@/components/layout/RajaFooter';
import RajaSection from '@/components/layout/RajaSection';
import RajaModal from '@/components/layout/RajaModal';
import RajaLoader from '@/components/layout/RajaLoader';

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
    name: 'Surfaces',
    swatches: [
      { token: 'chrome-bg',     bg: 'bg-raja-chrome-bg' },
      { token: 'chrome-panel',  bg: 'bg-raja-chrome-panel' },
      { token: 'chrome-border', bg: 'bg-raja-chrome-border', dark: true },
    ],
  },
  {
    name: 'Text',
    swatches: [
      { token: 'chrome-muted', bg: 'bg-raja-chrome-muted', dark: true },
      { token: 'chrome-text',  bg: 'bg-raja-chrome-text',  dark: true },
    ],
  },
  {
    name: 'Action',
    swatches: [
      { token: 'chrome-action',      bg: 'bg-raja-chrome-action', dark: true },
      { token: 'chrome-error',       bg: 'bg-raja-chrome-error',  dark: true },
      { token: 'chrome-error-light', bg: 'bg-raja-chrome-error-light' },
    ],
  },
];

function Block({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border border-raja-chrome-border bg-raja-chrome-bg p-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-garamond text-2xl font-bold text-raja-chrome-text">{title}</h2>
        {subtitle && <p className="text-sm text-raja-chrome-muted">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 border-t border-raja-chrome-border pt-4 first:border-0 first:pt-0">
      <span className="text-xs font-medium uppercase tracking-wide text-raja-chrome-muted">{label}</span>
      <div className="flex flex-wrap items-center gap-4">{children}</div>
    </div>
  );
}

export default function DesignShowcase() {
  const [text, setText] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [role, setRole] = useState('');
  const [subscribed, setSubscribed] = useState(true);
  const [frequency, setFrequency] = useState('weekly');
  const [date, setDate] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <main className="min-h-screen bg-raja-chrome-panel">
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-12">
        <header className="flex flex-col gap-2">
          <div className="self-start border border-raja-chrome-action px-2 py-0.5">
            <span className="text-xs font-medium uppercase tracking-wide text-raja-chrome-action">Design System</span>
          </div>
          <h1 className="font-garamond text-3xl font-bold text-raja-chrome-text">Raja Design Base</h1>
          <p className="text-sm text-raja-chrome-muted">
            Every shared <code className="font-mono text-raja-chrome-action">Raja*</code> component, rendered live — the chrome domain only (site shell, forms, nav). Core-game components (board, pieces, mana) live outside this system; see the design brief.
          </p>
        </header>

        <Block title="Palette" subtitle="Chrome tokens defined in globals.css under @theme inline.">
          {PALETTE_GROUPS.map((group) => (
            <Row key={group.name} label={group.name}>
              <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {group.swatches.map((s) => (
                  <div key={s.token} className={`flex h-20 flex-col justify-end border border-raja-chrome-border p-2 ${s.bg}`}>
                    <span className={`text-xs font-medium ${s.dark ? 'text-raja-chrome-bg' : 'text-raja-chrome-text'}`}>{s.token}</span>
                  </div>
                ))}
              </div>
            </Row>
          ))}
        </Block>

        <Block title="Typography">
          <Row label="EB Garamond">
            <div className="flex flex-col gap-2">
              <p className="font-garamond text-3xl font-bold text-raja-chrome-text">Aa Bb Cc — Design System</p>
              <p className="font-garamond text-xl text-raja-chrome-text">The quick brown fox jumps over the lazy dog</p>
              <p className="font-garamond text-sm text-raja-chrome-muted">
                Body copy — 0.875rem. Classical serif, used across chrome and game domains alike.
              </p>
            </div>
          </Row>
        </Block>

        <Block title="RajaHeader" subtitle="Site nav bar — open and protected variants.">
          <Row label="Open">
            <RajaHeader variant="open" />
          </Row>
          <Row label="Protected">
            <RajaHeader variant="protected" />
          </Row>
        </Block>

        <Block title="RajaButton" subtitle="Primary (orange action) and alt (panel) variants.">
          <Row label="Action">
            <RajaButton variant="action" text="Save Changes" />
            <RajaButton variant="action" alt text="Cancel" />
            <RajaButton variant="action" text="Saving…" loading />
            <RajaButton variant="action" text="Disabled" disabled />
          </Row>
          <Row label="Link">
            <RajaButton variant="link" href="#" text="View details" />
            <RajaButton variant="link" alt href="#" text="Back" />
          </Row>
          <Row label="Full width">
            <RajaButton variant="action" fullWidth text="Continue" />
          </Row>
        </Block>

        <Block title="Form fields">
          <div className="grid gap-5 sm:grid-cols-2">
            <RajaTextField id="name" label="Full name" value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Alex Morgan" />
            <RajaTextField id="email" label="Email (validates on blur)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            <RajaDropdown
              id="role"
              label="Role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Choose a role"
              options={[
                { value: 'admin', label: 'Admin' },
                { value: 'editor', label: 'Editor' },
                { value: 'viewer', label: 'Viewer' },
              ]}
            />
            <RajaDatePicker id="date" label="Start date" value={date} onChange={(e) => setDate(e.target.value)} />
            <RajaTextField id="err" label="With error" value="??" onChange={() => {}} error="Age must be a number" />
            <RajaFileUpload label="Profile photo" onChange={() => {}} accept="image/*" />
          </div>
          <RajaTextArea id="notes" label="Bio" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="A short description…" rows={3} />
        </Block>

        <Block title="Selection controls">
          <Row label="Checkbox">
            <RajaCheckbox id="subscribe" label="Subscribe to updates" checked={subscribed} onChange={(e) => setSubscribed(e.target.checked)} />
            <RajaCheckbox id="disabled-cb" label="Disabled" checked={false} onChange={() => {}} disabled />
          </Row>
          <Row label="Radio — notification frequency">
            <RajaRadio
              name="frequency"
              value={frequency}
              onChange={setFrequency}
              options={[
                { value: 'daily', label: 'Daily' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' },
                { value: 'never', label: 'Never' },
              ]}
            />
          </Row>
        </Block>

        <Block title="RajaLoader">
          <Row label="Sizes (on chrome bg)">
            <RajaLoader size="sm" />
            <RajaLoader size="md" />
            <RajaLoader size="lg" />
          </Row>
          <Row label="Alt (on dark chrome)">
            <div className="flex items-center gap-4 bg-raja-chrome-text p-4">
              <RajaLoader size="sm" alt />
              <RajaLoader size="md" alt />
              <RajaLoader size="lg" alt />
            </div>
          </Row>
        </Block>

        <Block title="RajaModal">
          <Row label="Overlay">
            <RajaButton variant="action" text="Open modal" onClick={() => setModalOpen(true)} />
          </Row>
        </Block>

        <Block title="RajaSection" subtitle="Full-width band — default and alt (dark chrome).">
          <div className="overflow-hidden border border-raja-chrome-border">
            <RajaSection>
              <div className="p-6">
                <h2 className="text-xl font-bold text-raja-chrome-text">Default section</h2>
                <p className="mt-1 text-sm text-raja-chrome-muted">Light chrome background, dark text.</p>
              </div>
            </RajaSection>
            <RajaSection alt>
              <div className="p-6">
                <h2 className="text-xl font-bold text-raja-chrome-bg">Alt section</h2>
                <p className="mt-1 text-sm text-raja-chrome-bg">Dark chrome background, light text.</p>
              </div>
            </RajaSection>
          </div>
        </Block>

        <Block title="RajaFooter">
          <RajaFooter alt>
            <div className="flex items-center justify-between px-6 py-4 text-sm">
              <span className="font-garamond text-raja-chrome-bg">Raja</span>
              <span className="text-raja-chrome-bg">© 2026</span>
            </div>
          </RajaFooter>
        </Block>
      </div>

      {modalOpen && (
        <RajaModal
          title="Confirm Action"
          onClose={() => setModalOpen(false)}
          footer={
            <div className="flex justify-end gap-2 p-3">
              <RajaButton variant="action" alt text="Cancel" onClick={() => setModalOpen(false)} />
              <RajaButton variant="action" text="Confirm" onClick={() => setModalOpen(false)} />
            </div>
          }
        >
          <div className="flex flex-col gap-3 p-4">
            <p className="text-sm text-raja-chrome-text">
              A modal composes the base shell — title bar, scrollable body, and a footer slot for actions.
            </p>
          </div>
        </RajaModal>
      )}
    </main>
  );
}
