const { linkABHA, getProfile } = require('../services/abhaService');

const linkUserABHA = async (req, res) => {
  try {
    const { name, mobile } = req.body;
    
    if (!name || !mobile) {
      return res.status(400).json({ error: 'Name and mobile are required' });
    }

    const result = await linkABHA(name, mobile);
    return res.json(result);
  } catch (error) {
    console.error('ABHA Link Error:', error);
    res.status(500).json({ error: 'Failed to link ABHA' });
  }
};

const fetchUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const profile = await getProfile(userId);
    return res.json(profile);
  } catch (error) {
    console.error('ABHA Fetch Error:', error);
    res.status(404).json({ error: error.message });
  }
};

module.exports = {
  linkUserABHA,
  fetchUserProfile
};
