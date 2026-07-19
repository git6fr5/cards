export interface GameHistoryEntry {
  room: string;
  result: 'win' | 'loss';
  opponent_display_name: string | null;
  created_at: string;
}

export interface FriendEntry {
  id: number;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  responded_at: string | null;
  requester_player_id: number;
  recipient_player_id: number;
  requester_display_name: string | null;
  recipient_display_name: string | null;
}

export interface GameInviteEntry {
  id: number;
  status: 'pending' | 'claimed';
  created_at: string;
  game_id: number;
  inviter_player_id: number;
  invitee_player_id: number;
  inviter_display_name: string | null;
  invitee_display_name: string | null;
  room: string | null;
  invitee_player_index: number | null;
}

export interface ActiveGameEntry {
  room: string;
  opponent_display_name: string | null;
  created_at: string;
  player_index: number;
}

export function friendCounterpartName(friend: FriendEntry, currentPlayerId: number): string {
  const isRequester = friend.requester_player_id === currentPlayerId;
  const name = isRequester ? friend.recipient_display_name : friend.requester_display_name;
  return name ?? 'Unknown player';
}
