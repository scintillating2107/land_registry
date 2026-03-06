require('dotenv').config();
require('express-async-errors');

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const { authRouter } = require('./routes/auth.routes');
const { propertyRouter } = require('./routes/property.routes');
const { publicRouter } = require('./routes/public.routes');
const { userRouter } = require('./routes/user.routes');
const { applicationsRouter } = require('./routes/applications.routes');
const { notificationsRouter } = require('./routes/notifications.routes');
const { grievancesRouter } = require('./routes/grievances.routes');
const { reportsRouter } = require('./routes/reports.routes');
const { certificatesRouter } = require('./routes/certificates.routes');

const { authMiddleware } = require('./middleware/auth');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Basic rate limiting for auth + protected APIs
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
});
app.use('/api/', limiter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'bhoomichain-backend' });
});

// Public routes
app.use('/api/auth', authRouter);
app.use('/api/public', publicRouter);
app.use('/api/public/grievances', grievancesRouter);

// Protected routes below this line
app.use('/api', authMiddleware);
app.use('/api/users', userRouter);
app.use('/api/properties', propertyRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/grievances', grievancesRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/certificates', certificatesRouter);

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    error: true,
    message: err.message || 'Internal Server Error',
  });
});

module.exports = { app };

