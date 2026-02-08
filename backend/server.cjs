// ========== Backend Server (server.cjs) ==========
require("dotenv").config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require("multer");
const fs = require("fs");
const FormData = require("form-data");
const { exec } = require("child_process");
const ffmpeg = require('fluent-ffmpeg');
const OpenAI = require("openai");
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 5000;

const ffmpegPath = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegPath);

// Multer ayarı (uploads klasörü otomatik oluşur)
const upload = multer({ dest: "uploads/" });

// OpenAI API Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// OpenAI instance oluştur
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

if (!OPENAI_API_KEY) {
  console.error('⚠️  OPENAI_API_KEY environment variable is required!');
  process.exit(1);
}

// CORS ayarı (tüm originlere izin)
app.use(cors({
  origin: ['http://localhost:4200', 'http://localhost:5000', '*'], // Geliştirme ortamında tüm isteklere izin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// ========== Test Endpoint ==========
app.get("/", (req, res) => {
  res.send("Whisper Server Çalışıyor 🚀");
});

// ========== FFmpeg ile Transcribe Endpoint (Güncellenmiş versiyon) ==========
app.post("/transcribe", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Ses dosyası gönderilmedi." });
    }
    
    // Geçici dönüştürülmüş dosya yolu
    const convertedPath = `${req.file.path}.wav`;
    
    // MP3, OGG, M4A vb. fark etmeden WAV'a dönüştür
    await new Promise((resolve, reject) => {
      ffmpeg(req.file.path)
        .toFormat('wav')
        .on('end', resolve)
        .on('error', reject)
        .save(convertedPath);
    });
    
    // OpenAI'ye gönder
    const formData = new FormData();
    formData.append("file", fs.createReadStream(convertedPath));
    formData.append("model", "whisper-1");
    
    const response = await axios.post(
      "https://api.openai.com/v1/audio/transcriptions",
      formData,
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          ...formData.getHeaders(),
        },
        timeout: 30000
      }
    );
    
    // Geçici dosyaları sil
    fs.unlinkSync(req.file.path);
    fs.unlinkSync(convertedPath);
    
    res.json({ 
      success: true,
      text: response.data.text 
    });
    
  } catch (error) {
    console.error('Transcribe Error:', error.response?.data || error.message);
    
    // Hata olursa geçici dosyaları temizle
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    if (fs.existsSync(`${req.file.path}.wav`)) fs.unlinkSync(`${req.file.path}.wav`);
    
    res.status(500).json({ error: "Transkripsiyon başarısız oldu." });
  }
});

// ========== Eski Transcribe Endpoint (FormData ile - yedek olarak) ==========
app.post("/transcribe-legacy", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Ses dosyası gönderilmedi." });
    }

    const formData = new FormData();
    formData.append("file", fs.createReadStream(req.file.path));
    formData.append("model", "whisper-1");

    const response = await axios.post(
      "https://api.openai.com/v1/audio/transcriptions",
      formData,
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          ...formData.getHeaders(),
        },
        timeout: 30000 // 30 saniye timeout
      }
    );

    // Yüklenen geçici dosyayı sil
    fs.unlinkSync(req.file.path);

    res.json({ 
      success: true,
      text: response.data.text 
    });

  } catch (error) {
    console.error('Transcribe Legacy Error:', error.response?.data || error.message);
    
    // Dosya varsa sil
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // Hata tipine göre response
    if (error.code === 'ECONNABORTED') {
      res.status(408).json({ error: 'Request timeout. Please try again.' });
    } else if (error.response?.status === 401) {
      res.status(401).json({ error: 'Invalid OpenAI API key.' });
    } else if (error.response?.status === 429) {
      res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    } else {
      res.status(500).json({ error: "Transkripsiyon başarısız oldu." });
    }
  }
});

// ========== ChatGPT Endpoint ==========
app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversation = [], context } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Message is required and must be a string'
      });
    }

    // Conversation history'yi hazırla
    let messages = [];
    
    // System message ekle
    messages.push({
      role: 'system',
      content: `You are a helpful English language learning assistant. You help users practice English conversation. 
      ${context ? `Context: ${context}` : ''}
      
      Instructions:
      - Keep responses conversational and engaging
      - Provide gentle corrections when needed
      - Ask follow-up questions to continue the conversation
      - Use simple to intermediate English based on user level
      - Be encouraging and supportive
      - If user makes grammar/pronunciation mistakes, gently correct them
      - Keep responses between 20-50 words for voice interaction`
    });

    // Conversation history ekle (son 8 mesajı al)
    const recentConversation = conversation.slice(-8);
    messages.push(...recentConversation);

    // Yeni user mesajını ekle
    messages.push({
      role: 'user',
      content: message
    });

    // OpenAI API'ye istek gönder
    const openaiResponse = await axios.post(OPENAI_API_URL, {
      model: 'gpt-3.5-turbo', // veya 'gpt-4'
      messages: messages,
      max_tokens: 150,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 saniye timeout
    });

    const reply = openaiResponse.data.choices[0].message.content.trim();

    res.json({
      success: true,
      reply: reply,
      tokens_used: openaiResponse.data.usage?.total_tokens || 0
    });

  } catch (error) {
    console.error('ChatGPT API Error:', error.response?.data || error.message);
    
    // Hata tipine göre response
    if (error.code === 'ECONNABORTED') {
      res.status(408).json({
        success: false,
        error: 'Request timeout. Please try again.'
      });
    } else if (error.response?.status === 401) {
      res.status(401).json({
        success: false,
        error: 'Invalid OpenAI API key.'
      });
    } else if (error.response?.status === 429) {
      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Please try again later.'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error. Please try again.'
      });
    }
  }
});

// ========== Speech-to-Text (Whisper) Endpoint - Base64 Version (GÜNCELLENMİŞ HALİ) ==========
app.post('/api/speech-to-text', async (req, res) => {
  try {
    const { audioBase64 } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: 'Audio data is required' });
    }

    // Geçici dosya yolları
    const inputPath = `./uploads/temp_input_${Date.now()}.webm`;
    const outputPath = `./uploads/temp_output_${Date.now()}.mp3`;

    // Gelen base64 verisini dosyaya yaz
    // Regex ile 'data:audio/webm;base64,' gibi başlıkları temizle
    const base64Data = audioBase64.replace(/^data:audio\/\w+;base64,/, "");
    fs.writeFileSync(inputPath, Buffer.from(base64Data, 'base64'));

    // FFmpeg ile MP3'e çevir (Whisper'ın en sevdiği format)
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat('mp3')
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .save(outputPath);
    });
    
    // --- DEĞİŞİKLİK BURADA BAŞLIYOR ---
    // Axios yerine resmi OpenAI kütüphanesini kullanıyoruz
    const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(outputPath),
        model: "whisper-1",
        language: "tr" // Türkçe tanıma doğruluğunu artırmak için eklendi
    });
    // --- DEĞİŞİKLİK BURADA BİTİYOR ---

    // Geçici dosyaları sil
    fs.unlinkSync(inputPath);
    fs.unlinkSync(outputPath);

    res.json({
      success: true,
      text: transcription.text // Cevap formatı openai kütüphanesine göre güncellendi
    });

  } catch (error) {
    console.error('Whisper API Error:', error.response?.data || error); // Hata loglaması iyileştirildi
    res.status(500).json({ error: 'Ses dosyası işlenemedi.' });
  }
});

// ========== Health Check Endpoints ==========
app.get('/api/chat/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    openai_configured: !!OPENAI_API_KEY,
    ffmpeg_available: true // FFmpeg kurulu olduğu varsayımı
  });
});

// ========== Error Handler ==========
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Something went wrong!'
  });
});
// ========== Translation Endpoint (YENİ EKLENECEK) ==========
app.post('/api/translate', async (req, res) => {
  try {
    const { word } = req.body;
    if (!word) {
      return res.status(400).json({ success: false, error: 'Word is required' });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: "You are a helpful English-Turkish dictionary. Translate the given English word or phrase to Turkish. Also provide 1 simple example sentence in English using that word. Format: 'Translation: [Turkish Word]\nExample: [English Sentence]'" 
        },
        { role: "user", content: word }
      ],
      max_tokens: 100,
      temperature: 0.3
    });

    res.json({
      success: true,
      data: response.choices[0].message.content
    });

  } catch (error) {
    console.error('Translate Error:', error);
    res.status(500).json({ success: false, error: 'Translation failed' });
  }
});

// ========== Grammar Check Endpoint (YENİ EKLENECEK) ==========
app.post('/api/grammar-check', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, error: 'Text is required' });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: "You are a helpful English grammar teacher. Check the user's sentence for grammar mistakes. If it is correct, say 'Correct'. If there is a mistake, provide the corrected sentence and a very short explanation of the rule." 
        },
        { role: "user", content: text }
      ],
      max_tokens: 150,
      temperature: 0.3
    });

    res.json({
      success: true,
      correction: response.choices[0].message.content
    });

  } catch (error) {
    console.error('Grammar Check Error:', error);
    res.status(500).json({ success: false, error: 'Grammar check failed' });
  }
});

// ========== Start Server ==========
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`✅ OpenAI API configured: ${!!OPENAI_API_KEY}`);
  console.log(`🎵 FFmpeg audio conversion enabled`);
});

module.exports = app;