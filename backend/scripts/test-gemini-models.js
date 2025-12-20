
require('dotenv').config({ path: '../.env' });
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('No GEMINI_API_KEY found in ../.env');
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        // There isn't a direct listModels on genAI instance in some versions, 
        // but usually it's passed or we can try to just run a simple prompt on likely candidates
        // Actually, the error message said "Call ListModels". 
        // In node SDK: const { GoogleGenerativeAI } = require("@google/generative-ai"); does not export listModels directly.
        // Use the API directly via fetch if SDK doesn't expose it easily, or assume standard names.
        // Let's try to verify standard names.

        console.log("Testing common model names...");
        const candidates = [
            "gemini-1.5-flash",
            "gemini-1.5-pro",
            "gemini-1.0-pro",
            "gemini-pro"
        ];

        for (const modelName of candidates) {
            try {
                console.log(`Testing ${modelName}...`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Hello, are you there?");
                const response = await result.response;
                console.log(`✅ ${modelName} is WORKING. Response: ${response.text()}`);
            } catch (e) {
                console.log(`❌ ${modelName} failed: ${e.message}`);
            }
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

listModels();
