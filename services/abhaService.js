// Mock ABHA Database
const profiles = {
  'demo-user': {
    abhaId: "91-2345-6789-1234",
    name: "Rahul Sharma",
    age: 24,
    conditions: ["diabetes"],
    allergies: ["penicillin"]
  }
};

const linkABHA = async (name, mobile) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    abhaId: "91-" + Math.floor(1000 + Math.random() * 9000) + "-" + Math.floor(1000 + Math.random() * 9000) + "-" + Math.floor(1000 + Math.random() * 9000),
    name: name,
    verified: true
  };
};

const getProfile = async (userId) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const profile = profiles[userId];
  if (!profile) {
    throw new Error('Profile not found');
  }
  return profile;
};

module.exports = {
  linkABHA,
  getProfile
};
