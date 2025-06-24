import OpenAI from "openai";
import fs from "fs";
import path from "path";
import https from "https";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export async function generateLogo(logoName: string, description?: string): Promise<{ url: string, localPath: string }> {
  try {
    if (!openai) {
      throw new Error('OpenAI API key not configured. Logo generation is not available.');
    }

    // Create logos directory if it doesn't exist
    const logosDir = path.join(process.cwd(), 'generated-logos');
    if (!fs.existsSync(logosDir)) {
      fs.mkdirSync(logosDir, { recursive: true });
    }

    // Create a professional prompt for the logo
    const prompt = description || `Create a modern, professional logo for "${logoName}". The logo should be:
    - Clean and minimalist design
    - Educational and technology-focused
    - Use vibrant but professional colors (blues, greens, or purples)
    - Include subtle AI/learning elements like neural networks, books, or brain symbols
    - Text should be readable and modern
    - Suitable for both light and dark backgrounds
    - High contrast and scalable
    - Professional corporate style`;

    console.log(`Generating logo for: ${logoName}`);
    
    // Generate image using DALL-E 3
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    if (!response.data || response.data.length === 0) {
      throw new Error("No image data returned from OpenAI");
    }
    
    const imageUrl = response.data[0].url;
    if (!imageUrl) {
      throw new Error("No image URL returned from OpenAI");
    }

    // Download and save the image locally
    const fileName = `${logoName.toLowerCase().replace(/\s+/g, '-')}-logo-${Date.now()}.png`;
    const localPath = path.join(logosDir, fileName);
    
    await downloadImage(imageUrl, localPath);
    
    console.log(`Logo saved to: ${localPath}`);
    
    return {
      url: imageUrl,
      localPath: localPath
    };

  } catch (error) {
    console.error('Error generating logo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to generate logo: ${errorMessage}`);
  }
}

function downloadImage(url: string, localPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(localPath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(localPath, () => {}); // Delete the file on error
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}