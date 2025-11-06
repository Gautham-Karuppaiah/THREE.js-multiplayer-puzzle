# THREE.js Multiplayer Puzzle

A multiplayer puzzle game built with Three.js and Colyseus for real-time synchronization.

## Prerequisites

- **Node.js** >= 20.9.0 ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)

## Quick Start

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd v2_puzzler
```

### 2. Install dependencies

Install dependencies for both server and client:

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Start the server

```bash
cd server
npm start
```

The server will start on **http://localhost:2567**

### 4. Start the client (in a new terminal)

```bash
cd client
npm run dev
```

The client will start on **http://localhost:5173** (or the next available port)

### 5. Open in browser

Navigate to the URL shown by Vite (typically http://localhost:5173) and start playing!

## Project Structure

```
v2_puzzler/
├── server/          # Colyseus game server
│   ├── src/         # Server source code
│   │   ├── index.js      # Server entry point
│   │   └── rooms/        # Game room logic
│   └── public/      # Static assets (images, etc.)
│
├── client/          # Three.js client
│   ├── src/         # Client source code
│   ├── public/      # Client assets
│   └── index.html   # Entry HTML file
│
└── README.md
```

## Development

### Server
- **Start**: `npm start` (in `server/` directory)
- **Run tests**: `npm test`
- **Format code**: `npm run format`

### Client
- **Development**: `npm run dev` (in `client/` directory)
- **Build for production**: `npm run build`
- **Preview production build**: `npm run preview`
- **Format code**: `npm run format`

## Configuration

### Server Port
The server defaults to port **2567**. You can change this by setting the `PORT` environment variable:

```bash
PORT=3000 npm start
```

### Client Connection
The client connects to the server at `ws://localhost:2567`. If you change the server port, update the connection URL in `client/src/mainv2.js`:

```javascript
const client = new Colyseus.Client("ws://localhost:YOUR_PORT")
```

## Troubleshooting

### Port already in use
If port 2567 or 5173 is already in use:
- **Server**: Use `PORT=<different-port> npm start`
- **Client**: Vite will automatically try the next available port

### Connection refused
Make sure the server is running before starting the client.

### Node version error
Check your Node.js version with `node --version`. You need >= 20.9.0. Install a newer version if needed.

## Technologies Used

- **Server**:
  - [Colyseus](https://colyseus.io/) - Multiplayer game server framework
  - [Express](https://expressjs.com/) - Web server
  - Node.js

- **Client**:
  - [Three.js](https://threejs.org/) - 3D graphics library
  - [Colyseus.js](https://docs.colyseus.io/colyseus/getting-started/javascript-client/) - Client SDK
  - [Vite](https://vite.dev/) - Build tool and dev server

## License

UNLICENSED
