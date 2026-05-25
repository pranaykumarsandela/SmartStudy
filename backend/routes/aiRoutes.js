const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const auth = require('../middleware/auth');
const User = require('../models/User');

const upload = multer({ storage: multer.memoryStorage() });

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Simple memory cache for the daily quote
let dailyQuoteCache = {
  date: null,
  quote: "The secret of getting ahead is getting started."
};

router.post('/upload-syllabus', auth, upload.single('syllabus'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let text = '';
    const fileBuffer = req.file.buffer;
    const mimeType = req.file.mimetype;

    if (mimeType === 'application/pdf') {
      const data = await pdfParse(fileBuffer);
      text = data.text;
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
      req.file.originalname.endsWith('.docx')
    ) {
      const data = await mammoth.extractRawText({ buffer: fileBuffer });
      text = data.value;
    } else {
      return res.status(400).json({ error: 'Unsupported file type. Please upload a PDF or DOCX file.' });
    }

    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Could not extract text from the file.' });
    }

    // Call Gemini to extract semesters, subjects, chapters and topics
    const prompt = `
      Extract a list of distinct academic semesters (e.g. "Semester 5", "Semester 6") and their corresponding subjects (or course names/modules), units or chapters, and topics from the following syllabus text.
      Return ONLY a JSON array of objects, where each object has a "semester" string and a "subjects" array. 
      Each subject object should have a "subject" string and a "chapters" array. 
      Each chapter object MUST have a "name" string which should represent the Unit Number from the syllabus (e.g. "UNIT - I", "UNIT 1"). Do not use general titles as chapter names, always prefer the exact Unit number.
      Inside each chapter object, extract all the detailed topics belonging to that unit into the "topics" array of strings.
      
      CRITICAL INSTRUCTION FOR TOPICS: You MUST break down the topics into a granular list of short, individual bullet points (e.g. ["Software Quality Metrics", "Costs of Software Quality"]). Do NOT group multiple topics into a single long comma-separated string!
      
      Do not include any other text or markdown formatting like \`\`\`json.
      Example output: [{"semester": "Semester 5", "subjects": [{"subject": "Data Mining", "chapters": [{"name": "UNIT - I", "topics": ["Data Preprocessing", "Data Warehousing"]}]}]}]

      Syllabus text:
      ${text}
    `;

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: "application/json" }
    });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let aiText = response.text();

    // Clean up potential markdown formatting
    aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
    console.log("AI Parsed Text:", aiText);
    
    let syllabusData = [];
    try {
      syllabusData = JSON.parse(aiText);
      if (!Array.isArray(syllabusData)) {
        throw new Error('Not an array');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiText);
      return res.status(500).json({ error: 'Failed to extract syllabus properly.' });
    }

    // Save to user profile
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Replace the old syllabus entirely so that any previous stale/broken schemas are wiped out.
    user.syllabus = syllabusData;
    await user.save();
    
    res.json({ message: 'Syllabus scanned successfully', syllabus: syllabusData });

  } catch (error) {
    console.error('Syllabus upload error:', error);
    res.status(500).json({ error: 'Server error during syllabus processing.' });
  }
});

router.get('/quote', auth, async (req, res) => {
  try {
    const today = new Date().toDateString();
    
    // Return cached quote if it's the same day
    if (dailyQuoteCache.date === today) {
      return res.json({ quote: dailyQuoteCache.quote });
    }

    const prompt = `Generate a single short, highly motivational quote for a student who is studying hard. Return only the quote text itself without quotes. Maximum 15 words.`;
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const quote = response.text().trim().replace(/^"|"$/g, '');
    
    // Update cache
    dailyQuoteCache = { date: today, quote };
    
    res.json({ quote });
  } catch (error) {
    console.error('Quote generation error:', error);
    // Graceful fallback to cached quote on API failure (like rate limits)
    res.json({ quote: dailyQuoteCache.quote });
  }
});

module.exports = router;
