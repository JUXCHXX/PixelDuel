// NetworkManager - WebRTC via PeerJS for online multiplayer
// PeerJS loaded via CDN in index.html

declare const Peer: any;

export interface NetMessage {
  type: 'input' | 'gameState' | 'gameEvent' | 'chat' | 'ready';
  payload: any;
  timestamp: number;
}

class NetworkManager {
  private peer: any = null;
  private conn: any = null;
  isHost = false;
  isConnected = false;
  private dataCallback: ((msg: NetMessage) => void) | null = null;
  private disconnectCallback: (() => void) | null = null;

  async createRoom(
    roomCode: string,
    onRoomCode: (code: string) => void,
    onPlayerJoined: () => void
  ) {
    this.isHost = true;
    this.peer = new Peer(roomCode); // Use the provided room code as Peer ID

    return new Promise<void>((resolve, reject) => {
      this.peer.on('open', () => {
        onRoomCode(roomCode);
        resolve();
      });
      this.peer.on('connection', (conn: any) => {
        this.conn = conn;
        this.setupConn();
        conn.on('open', () => {
          this.isConnected = true;
          onPlayerJoined();
        });
      });
      this.peer.on('error', (err: any) => {
        console.error('Peer error in createRoom:', err);
        reject(err);
      });
    });
  }

  async joinRoom(
    code: string,
    onConnected: () => void,
    onError: (err: any) => void
  ) {
    this.isHost = false;
    this.peer = new Peer();

    return new Promise<void>((resolve, reject) => {
      this.peer.on('open', () => {
        this.conn = this.peer.connect(code, { reliable: true });

        this.conn.on('open', () => {
          this.isConnected = true;
          this.setupConn();
          onConnected();
          resolve();
        });

        this.conn.on('error', (err: any) => {
          console.error('Connection error:', err);
          onError(err);
          reject(err);
        });
      });

      this.peer.on('error', (err: any) => {
        console.error('Peer error in joinRoom:', err);
        onError(err);
        reject(err);
      });

      // Timeout if unable to connect
      setTimeout(() => {
        if (!this.isConnected) {
          const timeoutErr = new Error('Connection timeout - peer not reachable');
          onError(timeoutErr);
          reject(timeoutErr);
        }
      }, 15000);
    });
  }

  private setupConn() {
    if (!this.conn) return;
    this.conn.on('data', (data: NetMessage) => {
      this.dataCallback?.(data);
    });
    this.conn.on('close', () => {
      this.isConnected = false;
      this.disconnectCallback?.();
    });
  }

  send(msg: NetMessage) {
    if (this.conn && this.isConnected) {
      this.conn.send(msg);
    }
  }

  sendInput(payload: any) {
    this.send({ type: 'input', payload, timestamp: Date.now() });
  }

  sendGameState(payload: any) {
    this.send({ type: 'gameState', payload, timestamp: Date.now() });
  }

  onData(cb: (msg: NetMessage) => void) { this.dataCallback = cb; }
  onDisconnect(cb: () => void) { this.disconnectCallback = cb; }

  disconnect() {
    this.conn?.close();
    this.peer?.destroy();
    this.conn = null;
    this.peer = null;
    this.isConnected = false;
    this.isHost = false;
  }

  private genCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }
}

export const networkManager = new NetworkManager();
