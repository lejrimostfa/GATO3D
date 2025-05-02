// server.js
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';

const app = express();
// Sert tout ce qui est dans public/
app.use(express.static(path.join(process.cwd(), 'public')));

// Crée le serveur HTTP
const httpServer = createServer(app);

// Monte le serveur WebSocket de signalisation sur le même port
const wss = new WebSocketServer({ server: httpServer });

let hostWs = null;

wss.on('connection', ws => {
  ws.on('message', raw => {
    const msg = JSON.parse(raw);
    switch (msg.type) {
      case 'register-host':
        hostWs = ws;
        console.log('Host enregistré');
        break;
      case 'register-guest':
        ws.isGuest = true;
        console.log('Guest enregistré');
        break;
      case 'offer':
        // Offre du Host → tous les Guests
        wss.clients.forEach(c => c.isGuest && c.send(raw));
        break;
      case 'answer':
        // Réponse du Guest → Host
        if (hostWs) hostWs.send(raw);
        break;
      case 'ice-candidate':
        // Relais ICE à tous les autres
        wss.clients.forEach(c => { if (c !== ws) c.send(raw); });
        break;
    }
  });
  ws.on('close', () => {
    if (ws === hostWs) hostWs = null;
  });
});

const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => {
  console.log(`Serveur HTTP & WS signaling lancé sur http://0.0.0.0:${PORT}`);
});