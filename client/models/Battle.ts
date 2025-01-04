import { Spirit } from "./Spirit"

export enum Position {
  TOP_BENCH_LEFT = 'Top-Bench-Left',
  TOP_BENCH_CENTER = 'Top-Bench-Center',
  TOP_BENCH_RIGHT = 'Top-Bench-Right',
  TOP_MIDDLE_LEFT = 'Top-Middle-Left',
  TOP_MIDDLE_RIGHT = 'Top-Middle-Right',
  TOP_FRONTLINE_CENTER = 'Top-Frontline-Center',
  BOTTOM_FRONTLINE_CENTER = 'Bottom-Frontline-Center',
  BOTTOM_MIDDLE_LEFT = 'Bottom-Middle-Left',
  BOTTOM_MIDDLE_RIGHT = 'Bottom-Middle-Right',
  BOTTOM_BENCH_LEFT = 'Bottom-Bench-Left',
  BOTTOM_BENCH_CENTER = 'Bottom-Bench-Center',
  BOTTOM_BENCH_RIGHT = 'Bottom-Bench-Right'
}

// Semantics for the battle positions
export const TOP_BENCH = [Position.TOP_BENCH_LEFT, Position.TOP_BENCH_CENTER, Position.TOP_BENCH_RIGHT]
export const TOP_MIDDLE = [Position.TOP_MIDDLE_LEFT, Position.TOP_MIDDLE_RIGHT]
export const BOTTOM_BENCH = [Position.BOTTOM_BENCH_LEFT, Position.BOTTOM_BENCH_CENTER, Position.BOTTOM_BENCH_RIGHT]
export const BOTTOM_MIDDLE = [Position.BOTTOM_MIDDLE_LEFT, Position.BOTTOM_MIDDLE_RIGHT]
export const BENCH_POSITIONS = [...TOP_BENCH, ...BOTTOM_BENCH]
export const TOP_ARENA = [Position.TOP_FRONTLINE_CENTER, ...TOP_MIDDLE, ...TOP_BENCH]
export const BOTTOM_ARENA = [Position.BOTTOM_FRONTLINE_CENTER, ...BOTTOM_MIDDLE, ...BOTTOM_BENCH]

export interface Battle {
  id: string;
  playerOneUserId: string;
  playerTwoUserId: string;
  playerOneTeamId: string;
  playerTwoTeamId: string;
  currentTurnUserId: string | null;
  positionMap: Map<Position, Spirit>;
}