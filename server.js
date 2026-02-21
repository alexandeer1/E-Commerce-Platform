import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Mock inventory state
let inventory = [
    { id: '1', name: 'Quantum Core', price: 999.99, stock: 12, image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=500', category: 'Tech' },
    { id: '2', name: 'Neural Link V2', price: 1499.00, stock: 5, image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=500', category: 'Cyber' },
    { id: '3', name: 'HyperDrive SSD', price: 299.50, stock: 154, image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&q=80&w=500', category: 'Hardware' },
    { id: '4', name: 'Plasmic Capacitor', price: 450.00, stock: 23, image: 'https://images.unsplash.com/photo-1614729939124-032f0b56c9ce?auto=format&fit=crop&q=80&w=500', category: 'Energy' }
];

// Mock Users Database
let users = [];

io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.emit('inventory_init', inventory);

    socket.on('purchase', (cartItems, callback) => {
        let success = true;
        let failedItem = null;

        for (const item of cartItems) {
            const dbItem = inventory.find(i => i.id === item.id);
            if (!dbItem || dbItem.stock < item.quantity) {
                success = false;
                failedItem = item.name;
                break;
            }
        }

        if (success) {
            for (const item of cartItems) {
                const dbItem = inventory.find(i => i.id === item.id);
                if (dbItem) {
                    dbItem.stock -= item.quantity;
                }
            }

            io.emit('inventory_update', inventory);
            callback({ success: true, message: 'Purchase successful!' });
        } else {
            callback({ success: false, message: `Insufficient stock for ${failedItem}` });
        }
    });

    socket.on('register', (data, callback) => {
        const exists = users.find(u => u.email === data.email);
        if (exists) {
            return callback({ success: false, message: 'Identity already exists in the Aether.' });
        }
        const newUser = { id: Date.now().toString(), name: data.name, email: data.email };
        users.push(newUser);
        callback({ success: true, user: newUser });
    });

    socket.on('login', (data, callback) => {
        const user = users.find(u => u.email === data.email);
        if (user) {
            // In a real app we'd check password here. This is a secure mock simulation.
            callback({ success: true, user });
        } else {
            callback({ success: false, message: 'Identity not found.' });
        }
    });

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});

// Simulate live global activity
setInterval(() => {
    if (io.engine.clientsCount > 0 && inventory.length > 0) {
        const randomItem = inventory[Math.floor(Math.random() * inventory.length)];
        const users = ['Alex', 'Sarah_99', 'Jordan', 'Neo', 'Trinity', 'Guest_4021'];
        const randomUser = users[Math.floor(Math.random() * users.length)];

        io.emit('live_activity', {
            id: Date.now().toString(),
            message: `${randomUser} just secured a ${randomItem.name}`,
            time: new Date().toLocaleTimeString()
        });
    }
}, 6000);

const PORT = 3001;
httpServer.listen(PORT, () => {
    console.log(`Aether Backend running on http://localhost:${PORT}`);
});
