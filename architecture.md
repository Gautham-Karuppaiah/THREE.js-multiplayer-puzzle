a.client actions

1. send pickup piece request (piece id, x, y) -> server checks if piece exists, is at the correct position, and is not already owned by someone. if yes, then change ownership to requester, and broadcast
2. move piece request (piece id, x ,y) -> server does the old checks. here i guess youd do a client side prediction with other clients interpolating as the server ticks broadcast updated locations?
3. drop piece request (piece id, x , y) -> server does the same checks, also checks if snaps and if so snaps. also remove ownership and whatnot




