/**
 * Controller for POST /bfhl endpoint.
 */

const { validatePayload } = require('../utils/validators');
const { processGraph } = require('../services/graphService');

// Identity fields — update these with your actual credentials
const USER_ID = 'peddireddirajeevsiddarth_16062005';
const EMAIL_ID = 'rs6820@srmist.edu.in';
const COLLEGE_ROLL_NUMBER = 'RA2311003010860';

function handleBfhl(req, res, next) {
  try {
    // Validate payload
    const validation = validatePayload(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Process graph
    const result = processGraph(validation.data);

    // Build response
    const response = {
      user_id: USER_ID,
      email_id: EMAIL_ID,
      college_roll_number: COLLEGE_ROLL_NUMBER,
      ...result,
    };

    return res.json(response);
  } catch (err) {
    next(err);
  }
}

module.exports = { handleBfhl };
