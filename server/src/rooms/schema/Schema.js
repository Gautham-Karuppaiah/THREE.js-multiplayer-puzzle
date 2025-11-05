import { schema } from "@colyseus/schema";


export const Player = schema({
    cursorX: "number",
    cursorY: "number"
});

export const PuzzlePiece = schema({
    positionX: "number",
    positionY: "number",
    heldBy: "string"
});


export const PuzzleRoomState = schema({
    players: { map: Player, default : new Map() },
    pieces: { map : PuzzlePiece, default: new Map() }
}
);
