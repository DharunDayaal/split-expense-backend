import cors from 'cors';

const allowedOrigins = [
    "http://localhost:3000",
];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);// allow requests with no origin

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}

export default cors(corsOptions);