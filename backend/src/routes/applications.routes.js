const express = require('express');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');

const { query } = require('../db');
const { requireRole } = require('../middleware/auth');
const { appendBlock } = require('../blockchain/blockchain');
const { computeRiskScore } = require('../services/risk.service');
const { evaluateFraudForTransfer } = require('../services/fraud.service');

const applicationsRouter = express.Router();

function nowIsoCompact() {
  return new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
}

function makeApplicationNo(prefix = 'APP') {
  return `${prefix}-${nowIsoCompact()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function makePaymentRef(prefix = 'PAY') {
  return `${prefix}-${nowIsoCompact()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function makeCertificateNo(prefix = 'CERT') {
  return `${prefix}-${nowIsoCompact()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

async function notify(userId, type, title, message) {
  await query(
    `INSERT INTO notifications(id, user_id, type, title, message)
     VALUES ($1, $2, $3, $4, $5)`,
    [uuidv4(), userId, type, title, message]
  );
}

const createTransferApplicationSchema = Joi.object({
  propertyId: Joi.string().required(),
  toUserId: Joi.string().guid({ version: 'uuidv4' }).required(),
  citizenNote: Joi.string().allow('', null).max(1000),
});

// Citizen creates a transfer request
applicationsRouter.post(
  '/transfer',
  requireRole('CITIZEN'),
  async (req, res) => {
    const { error, value } = createTransferApplicationSchema.validate(req.body);
    if (error) return res.status(400).json({ error: true, message: error.message });

    const userId = req.user.sub;
    const { propertyId, toUserId, citizenNote } = value;

    const { rows: propRows } = await query('SELECT * FROM properties WHERE property_id = $1', [
      propertyId,
    ]);
    const prop = propRows[0];
    if (!prop) return res.status(404).json({ error: true, message: 'Property not found' });
    if (prop.owner_user_id !== userId) {
      return res.status(403).json({ error: true, message: 'Only the current owner can request transfer' });
    }

    const { rows: toUserRows } = await query('SELECT id, role FROM users WHERE id = $1', [toUserId]);
    const toUser = toUserRows[0];
    if (!toUser) return res.status(400).json({ error: true, message: 'Buyer user does not exist' });
    if (toUser.role !== 'CITIZEN') {
      return res.status(400).json({ error: true, message: 'Buyer must be a CITIZEN user' });
    }
    if (toUserId === userId) {
      return res.status(400).json({ error: true, message: 'Buyer cannot be the same as seller' });
    }

    const id = uuidv4();
    const applicationNo = makeApplicationNo('TRF');

    await query(
      `INSERT INTO transfer_applications(
        id, application_no, property_id, from_user_id, to_user_id, status,
        citizen_note, created_by_user_id
      ) VALUES ($1,$2,$3,$4,$5,'SUBMITTED',$6,$7)`,
      [id, applicationNo, propertyId, userId, toUserId, citizenNote || null, userId]
    );

    // Simulated payment (gov fee)
    const paymentId = uuidv4();
    const paymentRef = makePaymentRef('FEE');
    await query(
      `INSERT INTO payments(id, user_id, reference, purpose, amount, status)
       VALUES ($1, $2, $3, $4, $5, 'PAID')`,
      [paymentId, userId, paymentRef, `Transfer application ${applicationNo}`, 250.0]
    );

    await appendBlock({
      txType: 'TRANSFER_REQUEST_SUBMITTED',
      propertyId,
      payload: { applicationNo, propertyId, fromUserId: userId, toUserId, paymentRef },
      createdByUserId: userId,
    });

    await notify(
      userId,
      'SUCCESS',
      'Transfer request submitted',
      `Application ${applicationNo} submitted for property ${propertyId}.`
    );
    await notify(
      toUserId,
      'INFO',
      'Incoming transfer request',
      `A transfer request (${applicationNo}) was submitted for property ${propertyId}.`
    );

    const { rows: appRows } = await query(
      'SELECT * FROM transfer_applications WHERE id = $1',
      [id]
    );
    res.status(201).json({ application: appRows[0], payment: { reference: paymentRef, amount: 250.0 } });
  }
);

// Citizen: view my applications
applicationsRouter.get('/my', async (req, res) => {
  const userId = req.user.sub;
  const { rows } = await query(
    `SELECT a.*,
            u1.name AS from_name, u1.email AS from_email,
            u2.name AS to_name, u2.email AS to_email
     FROM transfer_applications a
     JOIN users u1 ON u1.id = a.from_user_id
     JOIN users u2 ON u2.id = a.to_user_id
     WHERE a.created_by_user_id = $1
     ORDER BY a.created_at DESC`,
    [userId]
  );
  res.json({ applications: rows });
});

// Registrar inbox
applicationsRouter.get('/inbox', requireRole('REGISTRAR'), async (_req, res) => {
  const { rows } = await query(
    `SELECT a.*,
            u1.name AS from_name, u1.email AS from_email,
            u2.name AS to_name, u2.email AS to_email
     FROM transfer_applications a
     JOIN users u1 ON u1.id = a.from_user_id
     JOIN users u2 ON u2.id = a.to_user_id
     ORDER BY CASE a.status
                WHEN 'SUBMITTED' THEN 1
                WHEN 'UNDER_REVIEW' THEN 2
                WHEN 'APPROVED' THEN 3
                WHEN 'REJECTED' THEN 4
                WHEN 'CANCELLED' THEN 5
              END,
              a.created_at DESC`
  );
  res.json({ applications: rows });
});

const updateStatusSchema = Joi.object({
  registrarNote: Joi.string().allow('', null).max(2000),
});

applicationsRouter.post(
  '/:id/review',
  requireRole('REGISTRAR'),
  async (req, res) => {
    const { error, value } = updateStatusSchema.validate(req.body || {});
    if (error) return res.status(400).json({ error: true, message: error.message });

    const { id } = req.params;
    const { rows } = await query('SELECT * FROM transfer_applications WHERE id = $1', [id]);
    const app = rows[0];
    if (!app) return res.status(404).json({ error: true, message: 'Application not found' });

    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(app.status)) {
      return res.status(400).json({ error: true, message: `Cannot mark as under review from status ${app.status}` });
    }

    await query(
      `UPDATE transfer_applications
         SET status = 'UNDER_REVIEW',
             registrar_note = COALESCE($2, registrar_note),
             reviewed_by_user_id = $3,
             reviewed_at = NOW(),
             updated_at = NOW()
       WHERE id = $1`,
      [id, value.registrarNote || null, req.user.sub]
    );

    await notify(
      app.created_by_user_id,
      'INFO',
      'Transfer request under review',
      `Application ${app.application_no} is now under review by the registrar.`
    );

    const { rows: updated } = await query('SELECT * FROM transfer_applications WHERE id = $1', [id]);
    res.json({ application: updated[0] });
  }
);

applicationsRouter.post(
  '/:id/reject',
  requireRole('REGISTRAR'),
  async (req, res) => {
    const { error, value } = updateStatusSchema.validate(req.body || {});
    if (error) return res.status(400).json({ error: true, message: error.message });

    const { id } = req.params;
    const { rows } = await query('SELECT * FROM transfer_applications WHERE id = $1', [id]);
    const app = rows[0];
    if (!app) return res.status(404).json({ error: true, message: 'Application not found' });
    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(app.status)) {
      return res.status(400).json({ error: true, message: `Cannot reject from status ${app.status}` });
    }

    await query(
      `UPDATE transfer_applications
         SET status = 'REJECTED',
             registrar_note = $2,
             reviewed_by_user_id = $3,
             reviewed_at = NOW(),
             updated_at = NOW()
       WHERE id = $1`,
      [id, value.registrarNote || 'Rejected by registrar', req.user.sub]
    );

    await appendBlock({
      txType: 'TRANSFER_REQUEST_REJECTED',
      propertyId: app.property_id,
      payload: { applicationNo: app.application_no, registrarNote: value.registrarNote || null },
      createdByUserId: req.user.sub,
    });

    await notify(
      app.created_by_user_id,
      'ERROR',
      'Transfer request rejected',
      `Application ${app.application_no} was rejected. ${value.registrarNote ? `Reason: ${value.registrarNote}` : ''}`.trim()
    );

    const { rows: updated } = await query('SELECT * FROM transfer_applications WHERE id = $1', [id]);
    res.json({ application: updated[0] });
  }
);

applicationsRouter.post(
  '/:id/approve',
  requireRole('REGISTRAR'),
  async (req, res) => {
    const { error, value } = updateStatusSchema.validate(req.body || {});
    if (error) return res.status(400).json({ error: true, message: error.message });

    const { id } = req.params;
    const { rows } = await query('SELECT * FROM transfer_applications WHERE id = $1', [id]);
    const app = rows[0];
    if (!app) return res.status(404).json({ error: true, message: 'Application not found' });
    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(app.status)) {
      return res.status(400).json({ error: true, message: `Cannot approve from status ${app.status}` });
    }

    // Validate property state at approval time
    const { rows: propRows } = await query('SELECT * FROM properties WHERE property_id = $1', [
      app.property_id,
    ]);
    const prop = propRows[0];
    if (!prop) return res.status(404).json({ error: true, message: 'Property not found' });

    if (prop.owner_user_id !== app.from_user_id) {
      return res.status(400).json({ error: true, message: 'Seller is not current owner (owner changed)' });
    }
    if (prop.mortgage_status === 'ACTIVE') {
      return res.status(400).json({ error: true, message: 'Transfer blocked: active mortgage' });
    }
    if (prop.litigation_status === 'ACTIVE') {
      return res.status(400).json({ error: true, message: 'Transfer blocked: active litigation' });
    }
    if (prop.disputed) {
      return res.status(400).json({ error: true, message: 'Transfer blocked: property disputed' });
    }

    // Execute transfer
    await query(
      'UPDATE properties SET owner_user_id = $1, updated_at = NOW() WHERE property_id = $2',
      [app.to_user_id, app.property_id]
    );

    const block = await appendBlock({
      txType: 'TRANSFER',
      propertyId: app.property_id,
      payload: { propertyId: app.property_id, fromUserId: app.from_user_id, toUserId: app.to_user_id, applicationNo: app.application_no },
      createdByUserId: req.user.sub,
    });

    const transferId = uuidv4();
    await query(
      `INSERT INTO transfers(id, property_id, from_user_id, to_user_id, tx_block_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [transferId, app.property_id, app.from_user_id, app.to_user_id, block.id]
    );

    await computeRiskScore(app.property_id);
    const suspicious = await evaluateFraudForTransfer({ propertyId: app.property_id, fromUserId: app.from_user_id });

    await query(
      `UPDATE transfer_applications
         SET status = 'APPROVED',
             registrar_note = COALESCE($2, registrar_note),
             reviewed_by_user_id = $3,
             reviewed_at = NOW(),
             updated_at = NOW()
       WHERE id = $1`,
      [id, value.registrarNote || null, req.user.sub]
    );

    // Issue certificate
    const certId = uuidv4();
    const certificateNo = makeCertificateNo('TRF');
    const payload = {
      certificateNo,
      applicationNo: app.application_no,
      propertyId: app.property_id,
      fromUserId: app.from_user_id,
      toUserId: app.to_user_id,
      transferTxBlockId: block.id,
      issuedAt: new Date().toISOString(),
      suspicious,
    };
    await query(
      `INSERT INTO certificates(id, certificate_no, type, property_id, application_id, issued_to_user_id, issued_by_user_id, payload)
       VALUES ($1, $2, 'TRANSFER_APPROVAL', $3, $4, $5, $6, $7)`,
      [certId, certificateNo, app.property_id, app.id, app.to_user_id, req.user.sub, payload]
    );

    await appendBlock({
      txType: 'CERTIFICATE_ISSUED',
      propertyId: app.property_id,
      payload: { certificateNo, applicationNo: app.application_no, issuedToUserId: app.to_user_id },
      createdByUserId: req.user.sub,
    });

    await notify(
      app.created_by_user_id,
      'SUCCESS',
      'Transfer approved',
      `Application ${app.application_no} approved. Ownership transferred for property ${app.property_id}.`
    );
    await notify(
      app.to_user_id,
      'SUCCESS',
      'Property transferred to you',
      `You are now the owner of property ${app.property_id}. Certificate: ${certificateNo}.`
    );

    const { rows: updated } = await query('SELECT * FROM transfer_applications WHERE id = $1', [id]);
    res.json({
      application: updated[0],
      transfer: { id: transferId, txBlockId: block.id, suspicious },
      certificate: { id: certId, certificateNo, payload },
    });
  }
);

module.exports = { applicationsRouter };

