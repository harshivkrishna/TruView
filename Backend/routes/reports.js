const express = require('express');
const Report = require('../models/Report');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Create a new report
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { reviewId, reason, description } = req.body;
    
    // Check if user already reported this review
    const existingReport = await Report.findOne({
      review: reviewId,
      reportedBy: req.user.userId
    });

    if (existingReport) {
      return res.status(400).json({ message: 'You have already reported this review' });
    }

    const report = new Report({
      review: reviewId,
      reportedBy: req.user.userId,
      reason,
      description
    });

    await report.save();
    res.status(201).json({ message: 'Report submitted successfully' });
  } catch (error) {
    console.error('Report creation error:', error);
    res.status(500).json({ message: 'Error creating report', error: error.message });
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;