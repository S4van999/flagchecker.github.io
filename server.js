const express = require('express');
const multer = require('multer');
const fs = require('fs');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const WEBHOOK_URL = 'https://discord.com/api/webhooks/1398097069847089204/ijzdxOcPh3aXe_cAtkh94ty9ctm6uLUeLU72ZRyz-2N7bR0-Jyytuw14ypSb9k9PX8ua';

const bannedFlags = [
  "DFIntRemoteEventSingleInvocationSizeLimit",
  "FIntUGCValidationLeftArmThresholdFront",
  "FIntUGCValidationRightArmThresholdFront",
  "FIntUGCValidationRightLegThresholdBack",
  "FIntUGCValidationLeftLegThresholdBack",
  "FIntUGCValidationHeadAttachmentThreshold",
  "FIntUGCValidationTorsoThresholdBack",
  "DFIntS2PhysicsSenderRate",
  "DFFlagDebugUseCustomSimHumanoidRadius",
  "DFIntTouchSenderMaxBandwidthBpsScaling",
  "DFIntTouchSenderMaxBandwidthBps",
  "FIntUGCValidateLegZMaxSlender",
  "DFIntMaxMissedWorldStepsRemembered",
  "DFIntGameNetOptimizeParallelPhysicsSendAssemblyBatch",
  "FIntUGCValidationRightLegThresholdSide",
  "FIntUGCValidationRightLegThresholdFront",
  "FIntUGCValidationTorsoThresholdSide",
  "FFlagHumanoidParallelFixTickleFloor2",
  "FFlagFixMemoryPriorizationCrash",
  "FIntUGCValidationTorsoThresholdFront",
  "FIntUGCValidationLeftArmThresholdBack",
  "FIntUGCValidationLeftArmThresholdSide",
  "FIntUGCValidationLeftLegThresholdFront",
  "FIntUGCValidationLeftLegThresholdSide",
  "FIntUGCValidationRightArmThresholdBack",
  "FIntUGCValidationRightArmThresholdSide",
  "DFIntSimAdaptiveHumanoidPDControllerSubstepMultiplier",
  "DFIntPhysicsCountLocalSimulatedTouchEventsHundredthsPercentage",
  "DFIntDataSenderRate",
  "DFIntMaxClientSimulationRadius",
  "DFIntSolidFloorPercentForceApplication",
  "DFIntNonSolidFloorPercentForceApplication",
  "DFIntGameNetPVHeaderTranslationZeroCutoffExponent",
  "FIntParallelDynamicPartsFastClusterBatchSize",
  "DFIntMaximumFreefallMoveTimeInTenths",
  "DFIntAssemblyExtentsExpansionStudHundredth",
  "DFIntSimBroadPhasePairCountMax",
  "DFIntPhysicsDecompForceUpgradeVersion",
  "DFIntMaxAltitudePDStickHipHeightPercent",
  "DFIntUnstickForceAttackInTenths",
  "DFIntMinClientSimulationRadius",
  "DFIntMinimalSimRadiusBuffer",
  "DFFlagDebugPhysicsSenderDoesNotShrinkSimRadius",
  "FFlagDebugUseCustomSimRadius",
  "FIntGameNetLocalSpaceMaxSendIndex",
  "DFFlagSimHumanoidTimestepModelUpdate",
  "FFlagSimAdaptiveTimesteppingDefault2"
];




// parse URL-encoded bodies and JSON bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));

app.post('/scan', upload.array('files'), async (req, res) => {
  const username = req.body.username?.trim() || 'Unknown User';
  const results = [];

  for (const file of req.files) {
    try {
      const content = fs.readFileSync(file.path, 'utf-8');
      const foundFlags = bannedFlags.filter(flag => content.includes(flag));

      let messageContent = '';

      if (foundFlags.length > 0) {
        messageContent = `🚨 **${username}**, your flags that have been scanned are banned:\nFile: \`${file.originalname}\`\nFlags: \`${foundFlags.join('`, `')}\``;
      } else {
        messageContent = `✅ **${username}**, your flags that have been scanned have no banned flags in file: \`${file.originalname}\`.`;
      }

      const message = { content: messageContent };

      try {
        const response = await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message),
        });
        if (!response.ok) {
          const text = await response.text();
          console.error(`Webhook send failed: ${response.status} ${response.statusText}`, text);
        }
      } catch (err) {
        console.error('Error sending webhook:', err);
      }

      results.push({ file: file.originalname, bannedFlags: foundFlags });

    } catch (err) {
      console.error(`Error processing file ${file.originalname}:`, err);
      results.push({ file: file.originalname, error: 'Failed to process file' });
    } finally {
      try {
        fs.unlinkSync(file.path);
      } catch (unlinkErr) {
        console.error(`Failed to delete uploaded file ${file.path}:`, unlinkErr);
      }
    }
  }

  res.json(results);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
