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
        return res.status(401).json({ message: 'Missing token' });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.userId = decoded.id;
        next();
    });
}

// ====================== UTILS ======================
function getFasciaOraria(date = new Date()) {
    const hour = date.getHours();
    if (hour >= 11 && hour < 16) return 'Lunch';
    if (hour >= 18 && hour < 24) return 'Dinner';
    return null;
}

// ====================== AUTH ======================

// Register
app.post('/api/register', async (req, res) => {
    const { nome, cognome, email, password } = req.body;

    if (!nome || !cognome || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const exists = await User.findOne({ email });
        if (exists) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            nome,
            cognome,
            email,
            password: hashedPassword
        });

        await user.save();
        res.status(201).json({ message: 'Registration complete' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server errore' });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(400).json({ message: 'Invalid credentials' });
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
        res.status(500).json({ message: 'Server error' });
    }
});

// ====================== USER ======================

// Update user
app.put('/api/user', authenticateToken, async (req, res) => {
    const { nome, cognome, email, password } = req.body;

    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (nome) user.nome = nome;
        if (cognome) user.cognome = cognome;
        if (email) user.email = email;

        if (password) {
            user.password = await bcrypt.hash(password, 10);
        }

        await user.save();

        res.json({
            message: 'Updated data',
            user: {
                nome: user.nome,
                cognome: user.cognome,
                email: user.email
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete user
app.delete('/api/user', authenticateToken, async (req, res) => {
    try {
        await Booking.deleteMany({ user: req.userId });
        await User.findByIdAndDelete(req.userId);

        res.json({ message: 'Account successfully deleted' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ====================== BOOKINGS ======================

// Create booking
app.post('/api/book', authenticateToken, async (req, res) => {
    const { restaurantId, restaurantName, numPeople } = req.body;

    if (!restaurantId || !restaurantName || numPeople <= 0) {
        return res.status(400).json({ message: 'Invalid data' });
    }

    const now = new Date();
    const fascia = getFasciaOraria(now);

    if (!fascia) {
        return res.status(400).json({
            message: 'Reservations available for lunch or dinner only'
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
                message: `You already have a reservation for ${fascia}`
            });
        }

        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        if (restaurant.availableSeats < numPeople) {
            return res.status(400).json({ message: 'Insufficient places' });
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
            message: 'confirmed booking',
            remainingSeats: restaurant.availableSeats
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
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
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete booking
app.delete('/api/bookings/:id', authenticateToken, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // 🔥 USA restaurantId DALLA PRENOTAZIONE
        const restaurant = await Restaurant.findById(booking.restaurantId);
        if (restaurant) {
            restaurant.availableSeats += booking.numPeople;
            await restaurant.save();
        }

        await booking.deleteOne();

        res.json({ message: 'Reservation successfully cancelled' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error during cancellation' });
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
        res.status(500).json({ message: 'Server error' });
    }
});

// ====================== DEFAULT ======================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// ====================== START ======================
app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});
