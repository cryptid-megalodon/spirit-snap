import { Position } from "@/models/Battle"

export enum ActionType {
  MOVE = 'Move',
  ROTATE = 'Rotate',
  SWAP = 'Swap',
  SURRENDER = 'Surrender',
}

export interface MoveFields {
  attackerPosition: Position,
  targetPosition: Position,
  moveId: number,
}

export interface RotateFields {}

export interface SwapFields {
  SwapInPosition: Position,
  SwapOutPosition: Position,
}

export interface SurrenderFields {
  userId: string,
}

export interface Action {
  type: ActionType,
  fields: MoveFields | RotateFields | SwapFields | SurrenderFields,
}