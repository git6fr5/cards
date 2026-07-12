'use client';

import { useState } from 'react';
import RajaButton from '@/components/forms/RajaButton';

interface InviteLinkProps {
  room: string;
  otherPlayerIndex: number;
}

export default function InviteLink({ room, otherPlayerIndex }: InviteLinkProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const url = `${window.location.origin}/play/room?room=${room}&player=${otherPlayerIndex}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
  }

  return (
    <RajaButton
      alt
      variant="action"
      text={copied ? 'Copied!' : 'Invite other player'}
      onClick={handleCopy}
    />
  );
}
