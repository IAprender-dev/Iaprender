import { Router } from 'express';
import { readFileSync } from 'fs';
import path from 'path';

const router = Router();

// Serve custom CSS for Cognito hosted UI
router.get('/cognito-custom-ui.css', (req, res) => {
  try {
    const cssPath = path.join(__dirname, '../cognito-custom-ui.css');
    const css = readFileSync(cssPath, 'utf8');
    
    res.setHeader('Content-Type', 'text/css');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    res.send(css);
  } catch (error) {
    console.error('Error serving custom CSS:', error);
    res.status(404).send('CSS not found');
  }
});

// Serve custom JavaScript for additional Cognito UI enhancements
router.get('/cognito-custom-ui.js', (req, res) => {
  const js = `
    // Custom JavaScript for AWS Cognito Hosted UI - IAprender Enhancement
    (function() {
      'use strict';
      
      // Wait for DOM to be ready
      function domReady(fn) {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', fn);
        } else {
          fn();
        }
      }
      
      // Add custom branding and enhancements
      function enhanceCognitoUI() {
        // Add IAprender branding
        const header = document.querySelector('.modal-header') || document.querySelector('h1');
        if (header && !header.querySelector('.ia-logo')) {
          const logoDiv = document.createElement('div');
          logoDiv.className = 'ia-logo';
          logoDiv.innerHTML = \`
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="width: 80px; height: 80px; margin: 0 auto 16px; background: linear-gradient(135deg, #2563eb, #4338ca); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.3);">
                <span style="color: white; font-size: 24px; font-weight: bold;">IA</span>
              </div>
              <h1 style="color: #1e293b; font-size: 32px; font-weight: 700; margin: 0 0 8px 0; background: linear-gradient(135deg, #2563eb, #4f46e5); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">IAprender</h1>
              <p style="color: #64748b; font-size: 18px; font-weight: 500; margin: 0; line-height: 1.6;">Plataforma educacional com inteligência artificial</p>
            </div>
          \`;
          header.parentNode.insertBefore(logoDiv, header);
        }
        
        // Enhance form labels
        const labels = document.querySelectorAll('label');
        labels.forEach(label => {
          if (label.textContent) {
            label.style.cssText += \`
              color: #1e293b !important;
              font-weight: 700 !important;
              font-size: 14px !important;
              letter-spacing: 0.5px !important;
              text-transform: uppercase !important;
              margin-bottom: 8px !important;
            \`;
          }
        });
        
        // Enhance input fields
        const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], select');
        inputs.forEach(input => {
          input.style.cssText += \`
            width: 100% !important;
            padding: 16px !important;
            border: 2px solid #e2e8f0 !important;
            border-radius: 16px !important;
            font-size: 16px !important;
            font-weight: 500 !important;
            color: #1e293b !important;
            background: rgba(255, 255, 255, 0.8) !important;
            backdrop-filter: blur(8px) !important;
            transition: all 0.3s ease !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
          \`;
          
          input.addEventListener('focus', () => {
            input.style.cssText += \`
              border-color: #2563eb !important;
              box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.2) !important;
              transform: translateY(-1px) !important;
            \`;
          });
          
          input.addEventListener('blur', () => {
            input.style.transform = 'translateY(0) !important';
          });
        });
        
        // Enhance buttons
        const buttons = document.querySelectorAll('button, input[type="submit"], .btn');
        buttons.forEach(button => {
          if (button.type === 'submit' || button.classList.contains('btn-primary')) {
            button.style.cssText += \`
              width: 100% !important;
              padding: 16px 24px !important;
              background: linear-gradient(135deg, #2563eb, #4338ca, #7c3aed) !important;
              border: none !important;
              border-radius: 16px !important;
              color: white !important;
              font-size: 18px !important;
              font-weight: 700 !important;
              cursor: pointer !important;
              transition: all 0.3s ease !important;
              box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.4) !important;
              letter-spacing: 0.5px !important;
            \`;
            
            button.addEventListener('mouseenter', () => {
              button.style.cssText += \`
                background: linear-gradient(135deg, #1d4ed8, #3730a3, #6d28d9) !important;
                transform: translateY(-2px) !important;
                box-shadow: 0 20px 40px -10px rgba(37, 99, 235, 0.5) !important;
              \`;
            });
            
            button.addEventListener('mouseleave', () => {
              button.style.cssText += \`
                background: linear-gradient(135deg, #2563eb, #4338ca, #7c3aed) !important;
                transform: translateY(0) !important;
                box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.4) !important;
              \`;
            });
          }
        });
        
        // Add animated background
        if (!document.querySelector('.custom-bg')) {
          const bg = document.createElement('div');
          bg.className = 'custom-bg';
          bg.style.cssText = \`
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #f8fafc 0%, #e0f2fe 50%, #e0e7ff 100%);
            z-index: -1;
          \`;
          document.body.appendChild(bg);
          
          // Add animated elements
          const circle1 = document.createElement('div');
          circle1.style.cssText = \`
            position: fixed;
            top: -40px;
            right: -128px;
            width: 384px;
            height: 384px;
            background: linear-gradient(135deg, rgba(191, 219, 254, 0.3), rgba(199, 210, 254, 0.2));
            border-radius: 50%;
            filter: blur(48px);
            animation: pulse 2s ease-in-out infinite;
            z-index: -1;
          \`;
          document.body.appendChild(circle1);
          
          const circle2 = document.createElement('div');
          circle2.style.cssText = \`
            position: fixed;
            bottom: -40px;
            left: -128px;
            width: 384px;
            height: 384px;
            background: linear-gradient(45deg, rgba(196, 181, 253, 0.3), rgba(191, 219, 254, 0.2));
            border-radius: 50%;
            filter: blur(48px);
            animation: pulse 2s ease-in-out infinite;
            animation-delay: 1s;
            z-index: -1;
          \`;
          document.body.appendChild(circle2);
        }
        
        // Add CSS animation keyframes
        if (!document.querySelector('#custom-animations')) {
          const style = document.createElement('style');
          style.id = 'custom-animations';
          style.textContent = \`
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.8; }
            }
          \`;
          document.head.appendChild(style);
        }
      }
      
      // Initialize enhancements
      domReady(() => {
        enhanceCognitoUI();
        
        // Re-run enhancements if content changes (for SPA behavior)
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
              setTimeout(enhanceCognitoUI, 100);
            }
          });
        });
        
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
      });
    })();
  `;
  
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
  res.send(js);
});

export default router;