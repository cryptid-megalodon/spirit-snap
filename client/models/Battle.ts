
export interface Battle {
  id: string;
  playerOneUserId: string;
  playerTwoUserId: string;
  playerOneTeamId: string;
  playerTwoTeamId: string;
  currentTurnUserId: string | null;
}