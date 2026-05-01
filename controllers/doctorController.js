const { getNearbyDoctors } = require('../services/doctorService');

const fetchDoctors = async (req, res) => {
  try {
    const { specialist, location } = req.body;
    
    if (!specialist) {
      return res.status(400).json({ error: 'Specialist is required' });
    }

    const doctors = await getNearbyDoctors(specialist, location);
    return res.json({ doctors });
  } catch (error) {
    console.error('Doctor Controller Error:', error);
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
};

module.exports = {
  fetchDoctors
};
