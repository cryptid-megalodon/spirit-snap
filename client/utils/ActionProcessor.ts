import { Action, ActionType, SurrenderFields, MoveFields, SwapFields } from "@/models/Action";
import { Battle, BOTTOM_ARENA, Position, TOP_ARENA } from "@/models/Battle";
import { Spirit } from "@/models/Spirit";


export function processAction(battle: Battle, action: Action): Battle {
  switch (action.type) {
    case ActionType.MOVE:
      return validateAndApplyMove(battle, action);
    case ActionType.ROTATE:
      return applyRotate(battle);
    case ActionType.SWAP:
      const swapFields = validateSwap(battle, action);
      return applySwap(battle, swapFields);
    case ActionType.SURRENDER:
      const surrenderFields = validateSurrender(battle, action);
      return applySurrender(battle, surrenderFields);
    default:
      return battle;
  }
}

function validateAndApplyMove(battle: Battle, action: Action): Battle {
  const moveFields = action.fields as MoveFields;
  const target = battle.positionMap.get(moveFields.targetPosition);
  if (target === undefined) {
    throw new Error('Target not found');
  }
  target.currentHitPoints = Math.max(0, target.currentHitPoints - 10);
  nextTurn(battle);
  return battle;
}

function applyRotate(battle: Battle): Battle {
  console.log('applyRotate');
  const frontlineSpirit = battle.positionMap.get(Position.BOTTOM_FRONTLINE_CENTER);
  const middleLeftSpirit = battle.positionMap.get(Position.BOTTOM_MIDDLE_LEFT);
  const middleRightSpirit = battle.positionMap.get(Position.BOTTOM_MIDDLE_RIGHT);
  
  if (frontlineSpirit && middleLeftSpirit && middleRightSpirit) {
    console.log('rotating');
    battle.positionMap.set(Position.BOTTOM_FRONTLINE_CENTER, middleLeftSpirit);
    battle.positionMap.set(Position.BOTTOM_MIDDLE_LEFT, middleRightSpirit);
    battle.positionMap.set(Position.BOTTOM_MIDDLE_RIGHT, frontlineSpirit);
  }
  return battle
}

function validateSwap(battle: Battle, action: Action): SwapFields {
  const swapFields = action.fields as SwapFields;
  const swapInSpirit = battle.positionMap.get(swapFields.SwapInPosition);
  const swapOutSpirit = battle.positionMap.get(swapFields.SwapOutPosition);
  if (!swapInSpirit) {
    throw new Error('Swap in spirit not found');
  }
  if (!swapOutSpirit) {
    throw new Error('Swap out spirit not found');
  }
  return swapFields;
}
function applySwap(battle: Battle, swapFields: SwapFields): Battle {
  const spiritToSwapOut = battle.positionMap.get(swapFields.SwapOutPosition) ?? {} as Spirit;
  const spiritToSwapIn = battle.positionMap.get(swapFields.SwapInPosition) ?? {} as Spirit;
  battle.positionMap.set(swapFields.SwapOutPosition, spiritToSwapIn);
  battle.positionMap.set(swapFields.SwapInPosition, spiritToSwapOut);
  nextTurn(battle);
  return battle;
}

function validateSurrender(battle: Battle, action: Action): SurrenderFields {
  const surrenderFields = action.fields as SurrenderFields;
  if (battle.currentTurnUserId !== surrenderFields.userId) {
    throw new Error('Not your turn');
  }
  return surrenderFields;
}
function applySurrender(battle: Battle, surrenderFields: SurrenderFields): Battle {
  return battle;
}

const switchSides = (battle: Battle): Battle => {
  const topArenaSpirits = TOP_ARENA.map(position => battle.positionMap.get(position) as Spirit);
  const bottomArenaSpirits = BOTTOM_ARENA.map(position => battle.positionMap.get(position) as Spirit);
  TOP_ARENA.forEach((position, index) => {
    battle.positionMap.set(position, bottomArenaSpirits[index]);
  });
  BOTTOM_ARENA.forEach((position, index) => {
    battle.positionMap.set(position, topArenaSpirits[index]);
  });
  return battle;
};

const nextTurn = (battle: Battle): Battle => {
  battle.currentTurnUserId = battle.currentTurnUserId === battle.playerOneUserId ? battle.playerTwoUserId : battle.playerOneUserId;
  return switchSides(battle);
};