import {Room, Client, getStateCallback } from "@colyseus/core"


export class PuzzleGame {
    puzzlePieces = {}
    players = {}
    room = null 


    constructor (){
    }
    async setup(){
        await this.connect()
        const $ = getStateCallbacks(this.room)
        for (this.room.   
        }

    
    
    async connect{
        const client = new Client("ws://localhost:something")
        try{
            this.room= await client.joinOrCreate("puzzleroom",{});
        }
        catch(e){
            console.log("could not connect with server")
        }
    }
    tick(){
    }
    async start(){
    }
}
