const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Models
const User = require('./models/User');
const Restaurant = require('./models/Restaurant');
const Booking = require('./models/Booking');

// ====================== CONFIG ======================
const PORT = 3000;
const SECRET_KEY = 'supersecret123';

const MONGO_URI = 'mongodb+srv://foodspot_user:FSTechWeb@foodspottechweb.m8th39g.mongodb.net/foodspotDB?retryWrites=true&w=majority';

// ====================== MIDDLEWARE ======================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ====================== MONGODB ======================
mongoose.connect(MONGO_URI)
    .then(() => console.log('Connesso a MongoDB Atlas'))
    .catch(err => console.error('Errore MongoDB:', err));

// ====================== JWT MIDDLEWARE ======================
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Token mancante' });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Token non valido' });
        }
        req.userId = decoded.id;
        next();
    });
}

// ====================== UTILS ======================
function getFasciaOraria(date = new Date()) {
    const hour = date.getHours();
    if (hour >= 11 && hour < 16) return 'pranzo';
    if (hour >= 18 && hour < 24) return 'cena';
    return null;
}

// ====================== AUTH ======================

// Register
app.post('/api/register', async (req, res) => {
    const { nome, cognome, email, password } = req.body;

    if (!nome || !cognome || !email || !password) {
        return res.status(400).json({ message: 'Tutti i campi sono obbligatori' });
    }

    try {
        const exists = await User.findOne({ email });
        if (exists) {
            return res.status(400).json({ message: 'Email già registrata' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            nome,
            cognome,
            email,
            password: hashedPassword
        });

        await user.save();
        res.status(201).json({ message: 'Registrazione completata' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Errore server' });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Credenziali non valide' });
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(400).json({ message: 'Credenziali non valide' });
        }

        const token = jwt.sign({ id: user._id }, SECRET_KEY, { expiresIn: '1h' });

        res.json({
            token,
            user: {
                nome: user.nome,
                cognome: user.cognome,
                email: user.email
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Errore server' });
    }
});

// ====================== USER ======================

// Update user
app.put('/api/user', authenticateToken, async (req, res) => {
    const { nome, cognome, email, password } = req.body;

    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: 'Utente non trovato' });

        if (nome) user.nome = nome;
        if (cognome) user.cognome = cognome;
        if (email) user.email = email;

        if (password) {
            user.password = await bcrypt.hash(password, 10);
        }

        await user.save();

        res.json({
            message: 'Dati aggiornati',
            user: {
                nome: user.nome,
                cognome: user.cognome,
                email: user.email
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Errore server' });
    }
});

// Delete user
app.delete('/api/user', authenticateToken, async (req, res) => {
    try {
        await Booking.deleteMany({ user: req.userId });
        await User.findByIdAndDelete(req.userId);

        res.json({ message: 'Account eliminato con successo' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Errore server' });
    }
});

// ====================== BOOKINGS ======================

// Create booking
app.post('/api/book', authenticateToken, async (req, res) => {
    const { restaurantId, restaurantName, numPeople } = req.body;

    if (!restaurantId || !restaurantName || numPeople <= 0) {
        return res.status(400).json({ message: 'Dati non validi' });
    }

    const now = new Date();
    const fascia = getFasciaOraria(now);

    if (!fascia) {
        return res.status(400).json({
            message: 'Prenotazioni disponibili solo a pranzo o cena'
        });
    }

    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    try {
        const existing = await Booking.findOne({
            user: req.userId,
            fascia,
            createdAt: { $gte: startOfDay }
        });

        if (existing) {
            return res.status(400).json({
                message: `Hai già una prenotazione per ${fascia}`
            });
        }

        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({ message: 'Ristorante non trovato' });
        }

        if (restaurant.availableSeats < numPeople) {
            return res.status(400).json({ message: 'Posti insufficienti' });
        }

        restaurant.availableSeats -= numPeople;
        await restaurant.save();

        const booking = new Booking({
            user: req.userId,
            restaurantId,
            restaurantName,
            numPeople,
            fascia
        });

        await booking.save();

        res.status(201).json({
            message: 'Prenotazione confermata',
            remainingSeats: restaurant.availableSeats
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Errore server' });
    }
});

// Get user bookings
app.get('/api/bookings', authenticateToken, async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.userId })
            .sort({ createdAt: -1 });

        res.json({ bookings });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Errore server' });
    }
});

// Delete booking
app.delete('/api/bookings/:id', authenticateToken, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ message: 'Prenotazione non trovata' });
        }

        // 🔥 USA restaurantId DALLA PRENOTAZIONE
        const restaurant = await Restaurant.findById(booking.restaurantId);
        if (restaurant) {
            restaurant.availableSeats += booking.numPeople;
            await restaurant.save();
        }

        await booking.deleteOne();

        res.json({ message: 'Prenotazione annullata con successo' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Errore durante l’annullamento' });
    }
});


// ====================== RESTAURANTS ======================
app.get('/api/restaurants', async (req, res) => {
    try {
        const restaurants = await Restaurant.find({
            availableSeats: { $gt: 0 }
        });

        res.json({ restaurants });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Errore server' });
    }
});

// ====================== DEFAULT ======================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// ====================== START ======================
app.listen(PORT, () => {
    console.log(`Server avviato su http://localhost:${PORT}`);
});
