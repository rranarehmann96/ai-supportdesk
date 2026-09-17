// Durable Object for real-time chat room
export class ChatRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = new Map();
    this.messages = [];
  }

  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    // WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      return this.handleWebSocket(request);
    }

    // REST API for messages
    if (path === '/messages' && request.method === 'GET') {
      return new Response(JSON.stringify(this.messages), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Not found', { status: 404 });
  }

  async handleWebSocket(request) {
    const { 0: client, 1: server } = new WebSocketPair();
    const session = server.accept();

    const sessionId = crypto.randomUUID();
    this.sessions.set(sessionId, session);

    // Send existing messages to new connection
    this.messages.forEach(msg => {
      session.send(JSON.stringify(msg));
    });

    session.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        const message = {
          id: crypto.randomUUID(),
          content: data.content,
          sender: data.sender,
          ticketId: data.ticketId,
          timestamp: new Date().toISOString()
        };

        this.messages.push(message);

        // Broadcast to all connected clients
        this.sessions.forEach((s) => {
          if (s.readyState === WebSocket.OPEN) {
            s.send(JSON.stringify(message));
          }
        });
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    session.addEventListener('close', () => {
      this.sessions.delete(sessionId);
    });

    session.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
      this.sessions.delete(sessionId);
    });

    return new Response(null, { status: 101, webSocket: client });
  }
}