const express = require('express');
const path = require('path');
const multer = require('multer');
const tf = require('@tensorflow/tfjs');
const fs = require('fs');
const sharp = require('sharp'); // Replacing Jimp with the ultra-stable Sharp engine

const app = express();
const PORT = 3000;

const upload = multer({ dest: 'uploads/' });

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

let systemState = {
    hasUpload: false,
    humidity: 45, 
    riskLevel: 0, 
    activeFarmsAlerted: 0,
    diagnosis: "Healthy / Scanning Pending"
};

let aiModel;
let labels = [];

// Load the Teachable Machine Model over internal HTTP loop
async function loadAIModel() {
    try {
        const modelUrl = `http://localhost:${PORT}/model/model.json`;
        const metadataPath = path.join(__dirname, 'public', 'model', 'metadata.json');
        
        // Fixed the deprecation warning by ensuring metadataPath is a clean string
        if (fs.existsSync(String(metadataPath))) {
            const metadata = JSON.parse(fs.readFileSync(String(metadataPath), 'utf8'));
            labels = metadata.labels;
        }

        console.log("⏳ Loading Teachable Machine Brain Layer...");
        aiModel = await tf.loadLayersModel(modelUrl);
        
        console.log("===================================================");
        console.log("✅ AI Model active and armed with labels:", labels);
        console.log("===================================================");
    } catch (error) {
        console.error("❌ Critical: Failed to load model files!");
        console.error("Reason:", error.message);
    }
}
loadAIModel();

// Uses Sharp to flawlessly extract RGB pixels for TensorFlow
async function processImageToTensor(filePath) {
    // 1. Force sharp to resize to 224x224 and give us raw, uncompressed RGB pixels
    const { data, info } = await sharp(filePath)
        .resize(224, 224, { fit: 'fill' })
        .ensureAlpha(1.0) // Keep alpha channels consistent to read raw arrays
        .raw()
        .toBuffer({ resolveWithObject: true });

    const numPixels = 224 * 224;
    const values = new Float32Array(numPixels * 3);

    // 2. Map the raw buffer bytes straight into our normalized float array
    for (let i = 0; i < numPixels; i++) {
        const r = data[i * 4 + 0];
        const g = data[i * 4 + 1];
        const b = data[i * 4 + 2];

        // Teachable machine pixel normalization
        values[i * 3 + 0] = (r / 127.5) - 1;
        values[i * 3 + 1] = (g / 127.5) - 1;
        values[i * 3 + 2] = (b / 127.5) - 1;
    }

    // 3. Construct the clean 4D Tensor array matrix
    return tf.tidy(() => {
        const rawTensor = tf.tensor3d(values, [224, 224, 3], 'float32');
        return rawTensor.expandDims(0);
    });
}

app.get('/api/status', (req, res) => res.json(systemState));

app.post('/api/scan-upload', upload.single('leafImage'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No image file uploaded." });
        }

        if (!aiModel) {
            return res.status(503).json({ success: false, message: "AI model is warming up. Try again." });
        }

        // Process the image using Sharp
        const tensorInput = await processImageToTensor(req.file.path);

        const prediction = aiModel.predict(tensorInput);
        const scores = await prediction.data();

        const highestScoreIndex = scores.indexOf(Math.max(...scores));
        const detectedDisease = labels[highestScoreIndex] || "Unknown Sickness Profile";

        console.log(`\n🔎 [Scan Log] Detected Result: ${detectedDisease} (Confidence: ${(scores[highestScoreIndex] * 100).toFixed(2)}%)`);
        
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        systemState.hasUpload = true;
        systemState.diagnosis = detectedDisease;

        const lowerLabel = detectedDisease.toLowerCase();
        if (lowerLabel.includes('healthy')) {
            systemState.riskLevel = 0; 
            systemState.humidity = 52; 
            systemState.activeFarmsAlerted = 0;
        } else if (lowerLabel.includes('early') || lowerLabel.includes('mild') || lowerLabel.includes('spot')) {
            systemState.riskLevel = 1; 
            systemState.humidity = 71; 
            systemState.activeFarmsAlerted = 1;
        } else {
            systemState.riskLevel = 2; 
            systemState.humidity = 89; 
            systemState.activeFarmsAlerted = 4;
        }

        tensorInput.dispose();
        prediction.dispose();

        res.json({
            success: true,
            message: "Real-time diagnosis rendered.",
            state: systemState
        });

    } catch (error) {
        console.error("Prediction Engine Fault:", error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/reset', (req, res) => {
    systemState = { hasUpload: false, humidity: 45, riskLevel: 0, activeFarmsAlerted: 0, diagnosis: "Healthy / Scanning Pending" };
    res.json({ success: true, state: systemState });
});

app.listen(PORT, () => {
    console.log(`===================================================`);
    console.log("🚀 Phytonix Backend Engine actively running!");
    console.log(`🌐 Open your web browser and go to: http://localhost:${PORT}`);
    console.log(`===================================================`);
});