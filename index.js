const express = require('express');
const axios = require('axios');
const querystring = require('querystring');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route
app.get('/', (req, res) => {
  res.send('LearningSphere - Plataforma Educacional');
});

// Cognito OAuth login route
app.get('/login', (req, res) => {
  const cognitoLoginUrl = `${process.env.COGNITO_DOMAIN}/login?` + querystring.stringify({
    response_type: 'code',
    client_id: process.env.COGNITO_CLIENT_ID,
    redirect_uri: process.env.COGNITO_REDIRECT_URI,
    scope: 'email openid profile'
  });
  
  res.redirect(cognitoLoginUrl);
});

// Callback endpoint for OAuth
app.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).send('Código de autorização não encontrado');
    }

    // Exchange authorization code for tokens
    const tokenResponse = await axios.post(`${process.env.COGNITO_DOMAIN}/oauth2/token`, 
      querystring.stringify({
        grant_type: 'authorization_code',
        client_id: process.env.COGNITO_CLIENT_ID,
        client_secret: process.env.COGNITO_CLIENT_SECRET,
        redirect_uri: process.env.COGNITO_REDIRECT_URI,
        code: code
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { access_token, id_token, refresh_token } = tokenResponse.data;

    // Get user info
    const userResponse = await axios.get(`${process.env.COGNITO_DOMAIN}/oauth2/userInfo`, {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    console.log('User Info:', userResponse.data);
    
    // Por enquanto, só para teste, responda algo simples
    res.send(`
      <h1>Callback recebido com sucesso!</h1>
      <h2>Informações do usuário:</h2>
      <pre>${JSON.stringify(userResponse.data, null, 2)}</pre>
      <h2>Tokens:</h2>
      <p>Access Token: ${access_token.substring(0, 50)}...</p>
      <p>ID Token: ${id_token.substring(0, 50)}...</p>
    `);
    
  } catch (error) {
    console.error('Erro no callback:', error.response?.data || error.message);
    res.status(500).send('Erro na autenticação: ' + (error.response?.data?.error || error.message));
  }
});

// Logout route
app.get('/logout', (req, res) => {
  const logoutUrl = `${process.env.COGNITO_DOMAIN}/logout?` + querystring.stringify({
    client_id: process.env.COGNITO_CLIENT_ID,
    logout_uri: process.env.COGNITO_REDIRECT_URI.replace('/callback', '')
  });
  
  res.redirect(logoutUrl);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT}/login to test OAuth`);
});