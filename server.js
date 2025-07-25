const express = require('express');
const multer = require('multer');
const fs = require('fs');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Discord webhook URL — replace with your webhook!
const WEBHOOK_URL = 'https://discord.com/api/webhooks/1398097069847089204/ijzdxOcPh3aXe_cAtkh94ty9ctm6uLUeLU72ZRyz-2N7bR0-Jyytuw14ypSb9k9PX8ua';

// List of banned FastFlags (customize as needed)
const bannedFlags = [
  "FastFlagEnableFPSUnlocker",
  "FastFlagBypassClient",
  "FastFlagUltraPerformanceMode",
  "FastFlagDisableAntiCheat",
];

// Setup multer to handle file uploads
const upload = multer({ dest: 'uploads/' });

// Serve static frontend files
app.use(express.static('public'));

// POST route to receive files and scan them
app.post('/scan', upload.array('files'), async (req, res) => {
  const results = [];

  for (const file of req.files) {
    const content = fs.readFileSync(file.path, 'utf-8');

    // Find banned flags present in file content
    const foundFlags = bannedFlags.filter(flag => content.includes(flag));

    if (foundFlags.length > 0) {
      // Send Discord webhook
      const message = {
        content: `🚨 **Banned flags detected!**\nFile: \`${file.originalname}\`\nFlags: \`${foundFlags.join('`, `')}\``
      };

      try {
        await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message)
        });
      } catch (err) {
        console.error('Webhook send failed:', err);
      }
    }

    results.push({
      file: file.originalname,
      bannedFlags: foundFlags
    });

    // Delete the uploaded file after reading
    fs.unlinkSync(file.path);
  }

  res.json(results);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
