import { schema } from "@colyseus/schema"

export const Player = schema({
    cursorX: "number",
    cursorY: "number"
})

export const Slot = schema({
    type: "number",
    connected: "boolean"
})

export const PuzzlePiece = schema({
    gridRow: "number",
    gridCol: "number",
    positionX: "number",
    positionY: "number",
    positionZ: "number",
    heldBy: "string",
    connectedPieces: { array: "number" },

    slotTop: Slot,
    slotRight: Slot,
    slotBottom: Slot,
    slotLeft: Slot
})

export const PuzzleRoomState = schema({
    players: { map: Player, default: new Map() },
    pieces: { array: PuzzlePiece },
    imageUrl: "string",
    rows: "number",
    cols: "number"
})
