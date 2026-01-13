// Simple test endpoint for Vercel
module.exports = (req, res) => {
  res.json({
    success: true,
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    path: req.url
  });
};
