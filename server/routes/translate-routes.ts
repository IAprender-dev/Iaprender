import { Router } from "express";

const router = Router();

// Rota para tradução usando LibreTranslate
router.post("/translate", async (req, res) => {
  try {
    const { text, sourceLang, targetLang } = req.body;

    if (!text || !targetLang) {
      return res.status(400).json({ error: "Texto e idioma de destino são obrigatórios" });
    }

    // Usando MyMemory API (gratuita e confiável)
    const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang === "auto" ? "autodetect" : sourceLang}|${targetLang}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'IAverse Educational Platform'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.responseStatus === 200) {
      res.json({ translatedText: data.responseData.translatedText });
    } else {
      throw new Error('Erro na resposta da API de tradução');
    }

  } catch (error) {
    console.error('Erro na tradução:', error);
    res.status(500).json({ error: "Erro interno do servidor na tradução" });
  }
});

// Rota para detectar idioma
router.post("/detect", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Texto é obrigatório" });
    }

    const response = await fetch('https://libretranslate.de/detect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('Erro na detecção de idioma:', error);
    res.status(500).json({ error: "Erro interno do servidor na detecção de idioma" });
  }
});

// Rota para listar idiomas disponíveis
router.get("/languages", async (req, res) => {
  try {
    const response = await fetch('https://libretranslate.de/languages');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('Erro ao buscar idiomas:', error);
    res.status(500).json({ error: "Erro interno do servidor ao buscar idiomas" });
  }
});

export default router;