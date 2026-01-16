const express = require("express");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
const PORT = 8080;
// const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://ollama:11434";
const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.text({ type: "text/plain", limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

// Data Loading
let bannedTerms = [];

function loadBannedTerms() {
	try {
		const content = fs.readFileSync(
			path.join(__dirname, "banned_terms.txt"),
			"utf-8",
		);
		const terms = content
			.split("\n")
			.map((line) => line.trim().toLowerCase())
			.filter((line) => line.length > 0);
		// Sort by length (descending) to prioritize longer phrases
		bannedTerms = terms.sort((a, b) => b.length - a.length);
		console.log(`Loaded ${bannedTerms.length} banned terms`);
	} catch (err) {
		console.error("Error loading banned terms:", err.message);
		bannedTerms = [];
	}
}

loadBannedTerms();

// Routes
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/index.css", (req, res) =>
	res.sendFile(path.join(__dirname, "index.css")),
);

app.get("/samples", (req, res) => {
	try {
		const samples = JSON.parse(
			fs.readFileSync(path.join(__dirname, "samples.json")),
		);
		res.json(samples);
	} catch (e) {
		res.json([]);
	}
});

app.get("/status", async (req, res) => {
	try {
		await axios.get(`${OLLAMA_HOST}/api/tags`, { timeout: 2000 });
		res.json({ ollama_available: true, terms_loaded: bannedTerms.length });
	} catch (e) {
		res.json({ ollama_available: false, terms_loaded: bannedTerms.length });
	}
});

// Get current banned terms
app.get("/banned-terms", (req, res) => {
	res.json({ terms: bannedTerms, count: bannedTerms.length });
});

// Upload custom banned terms
app.post("/banned-terms", (req, res) => {
	try {
		const content = req.body;
		if (typeof content !== "string") {
			return res.status(400).json({ error: "Expected plain text" });
		}
		const terms = content
			.split("\n")
			.map((line) => line.trim().toLowerCase())
			.filter((line) => line.length > 0);
		bannedTerms = terms.sort((a, b) => b.length - a.length);
		console.log(`Updated banned terms: ${bannedTerms.length} terms`);
		res.json({ success: true, count: bannedTerms.length });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

app.post("/moderate", async (req, res) => {
	const { text } = req.body;

	if (!text) return res.status(400).json({ error: "No text provided" });

	try {
		// Split text into sentences
		const sentences = text.split(/(?<=[.!?\n])\s*/).filter((s) => s.trim());
		const changes = [];

		// Process each sentence
		for (let i = 0; i < sentences.length; i++) {
			const sentence = sentences[i].trim();
			if (!sentence) continue;

			// Check for banned terms in this sentence
			const { hasBannedTerms, terms, highlightedOriginal } =
				checkSentenceForBannedTerms(sentence);

			if (hasBannedTerms) {
				// Call LLM to rephrase this specific sentence
				let revised = sentence;
				try {
					const response = await axios.post(`${OLLAMA_HOST}/api/generate`, {
						model: "llama3.2",
						prompt: `Rewrite this sentence to be professional and polite, removing offensive language while keeping the original intent. Return ONLY the rewritten sentence, nothing else.
Sentence: "${sentence}"`,
						stream: false,
						options: { temperature: 0.3, num_predict: 200 },
					});
					revised = response.data.response.trim();
				} catch (llmError) {
					console.error("LLM error for sentence:", llmError.message);
					// Fallback: just mask the terms
					revised = sentence;
					terms.forEach((term) => {
						const regex = new RegExp(
							`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
							"gi",
						);
						revised = revised.replace(regex, "[MODERATED]");
					});
				}

				changes.push({
					lineNumber: i + 1,
					original: sentence,
					originalHighlighted: highlightedOriginal,
					revised: revised,
					terms: terms,
				});
			}
		}

		// Save report
		const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
		const filename = path.join(
			__dirname,
			"reports",
			`report_${timestamp}.json`,
		);
		if (!fs.existsSync(path.join(__dirname, "reports"))) {
			fs.mkdirSync(path.join(__dirname, "reports"));
		}
		fs.writeFile(
			filename,
			JSON.stringify({ original: text, changes, timestamp }, null, 2),
			() => {},
		);

		res.json({ changes });
	} catch (error) {
		console.error("Moderation error:", error);
		res.status(500).json({ error: "Failed to process text" });
	}
});

// Check a single sentence for banned terms
function checkSentenceForBannedTerms(sentence) {
	let highlightedOriginal = sentence;
	const terms = [];

	bannedTerms.forEach((term) => {
		const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		const regex = new RegExp(`\\b${escapedTerm}\\b`, "gi");

		if (regex.test(sentence)) {
			terms.push(term);
			highlightedOriginal = highlightedOriginal.replace(
				new RegExp(`\\b(${escapedTerm})\\b`, "gi"),
				"<mark>$1</mark>",
			);
		}
	});

	return {
		hasBannedTerms: terms.length > 0,
		terms,
		highlightedOriginal,
	};
}

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
