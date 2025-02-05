export interface MoveRawData {
    id: string | null
    name: string | null
    type: string | null
}

export interface Move {
    id: string
    name: string
    type: string
}

export function isCompleteMove(move: MoveRawData): boolean {
    return move.id !== null &&
           move.name !== null &&
           move.type !== null
}

export function convertMoveRawDataToMove(move: MoveRawData): Move {
    if (!isCompleteMove(move)) {
        throw new Error('Move data is incomplete')
    }
    return {
        id: move.id as string,
        name: move.name as string,
        type: move.type as string,
    }
}
