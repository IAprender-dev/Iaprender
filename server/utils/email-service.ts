import sgMail from '@sendgrid/mail';

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailCredentials {
  to: string;
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  role: string;
}

export async function sendLoginCredentials(data: EmailCredentials): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('SendGrid API key not configured. Email not sent.');
    return false;
  }

  const roleTranslation = {
    student: 'Aluno',
    teacher: 'Professor',
    admin: 'Administrador',
    secretary: 'Secretária'
  };

  const msg = {
    to: data.to,
    from: 'noreply@iaverse.com.br', // Email verificado no SendGrid
    subject: 'Bem-vindo à IAverse - Suas credenciais de acesso',
    html: `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Credenciais de Acesso - IAverse</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Bem-vindo à IAverse!</h1>
          <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">Plataforma Educacional com Inteligência Artificial</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
          <h2 style="color: #333; margin-top: 0;">Olá, ${data.firstName} ${data.lastName}!</h2>
          
          <p>Sua conta foi criada com sucesso na plataforma IAverse. Aqui estão suas credenciais de acesso:</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #667eea;">Informações de Acesso</h3>
            <p><strong>Nome:</strong> ${data.firstName} ${data.lastName}</p>
            <p><strong>Função:</strong> ${roleTranslation[data.role as keyof typeof roleTranslation] || data.role}</p>
            <p><strong>Usuário:</strong> ${data.username}</p>
            <p><strong>Senha temporária:</strong> <code style="background: #f5f5f5; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${data.password}</code></p>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #856404; margin-top: 0;">⚠️ Importante:</h4>
            <ul style="color: #856404; margin: 0;">
              <li>Esta é uma senha temporária que deve ser alterada no seu primeiro login</li>
              <li>Mantenha suas credenciais em segurança</li>
              <li>Em caso de dúvidas, entre em contato com a secretaria</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://iaverse.com.br" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
              Acessar Plataforma
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="font-size: 14px; color: #666; text-align: center;">
            IAverse - Transformando a educação com Inteligência Artificial<br>
            Este é um email automático, não responda a esta mensagem.
          </p>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log('Email sent successfully to:', data.to);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}