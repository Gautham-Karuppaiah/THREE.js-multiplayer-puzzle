import { Room, Client } from "@colyseus/core";
import {PuzzlePiece, Player, PuzzleRoomState  } from "./schema/Schema.js";

export class PuzzleRoom extends Room {
  maxClients = 4;
  state = new PuzzleRoomState();

  onCreate (options) {
    
    this.onMessage("type", (client, message) => {
      //
      // handle "type" message.
      //
    });

  }

  onJoin (client, options) {
    console.log(client.sessionId, "joined!");
    const player = new Player();
    player.cursorX = 0;
    player.cursorY = 0;
    this.state.players.set(client.sessionId, player);

  }

  onLeave (client, consented) {
    console.log(client.sessionId, "left!");
    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

}
