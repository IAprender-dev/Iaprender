# AWS Cognito UI Customization Guide - IAprender

## Overview
This guide provides instructions to customize the AWS Cognito hosted UI to match the IAprender `/auth` page design.

## ⚠️ Important Note
AWS Cognito hosted UI has limited customization options. The most effective approach is to use one of these methods:

1. **Custom Domain + CSS** (Recommended)
2. **Custom Authentication Page** (Alternative)
3. **Hosted UI Basic Customization** (Limited)

## Method 1: Custom Domain + CSS (Recommended)

### Step 1: Configure Custom Domain in AWS Console

1. **Access AWS Cognito Console**
   - Go to: https://console.aws.amazon.com/cognito/
   - Select your User Pool: `us-east-1_4jqF97H2X`

2. **Configure Custom Domain**
   - Navigate to "App integration" → "Domain"
   - Click "Create custom domain"
   - Enter your domain: `auth.iaprender.com` (or similar)
   - Upload SSL certificate or use ACM
   - Click "Create domain"

3. **Configure DNS**
   - Add CNAME record pointing to the Cognito domain
   - Example: `auth.iaprender.com` → `dxxxxxxxxx.cloudfront.net`

### Step 2: Upload Custom CSS

1. **Access App Client Settings**
   - Go to "App integration" → "App clients"
   - Select your app client: `1ooqafj1v6bh3ff55t2ha56hn4`

2. **Upload Custom CSS**
   - In the "Hosted UI" section, click "Edit"
   - Upload the CSS file: `server/cognito-custom-ui.css`
   - This CSS matches the IAprender design from `/auth` page

### Step 3: Configure App Client

```javascript
// App Client Configuration
{
  "app_client_id": "1ooqafj1v6bh3ff55t2ha56hn4",
  "user_pool_id": "us-east-1_4jqF97H2X",
  "domain": "auth.iaprender.com",
  "callback_urls": [
    "https://39be0399-0121-4891-903c-353f1d3ba9d4-00-23r9t77u2drlf.janeway.replit.dev/auth/callback"
  ],
  "logout_urls": [
    "https://39be0399-0121-4891-903c-353f1d3ba9d4-00-23r9t77u2drlf.janeway.replit.dev/"
  ],
  "hosted_ui": {
    "css_url": "https://auth.iaprender.com/cognito-ui/cognito-custom-ui.css",
    "js_url": "https://auth.iaprender.com/cognito-ui/cognito-custom-ui.js"
  }
}
```

## Method 2: Custom Authentication Page (Alternative)

Create a custom authentication page that uses the existing `/auth` design but integrates with Cognito.

### Implementation
- Use the existing `/auth` page design
- Integrate Cognito authentication via API calls
- Maintain the same user experience
- Full control over styling and branding

## Method 3: Hosted UI Basic Customization (Limited)

### AWS Console Configuration

1. **Access Hosted UI Settings**
   - Go to AWS Cognito Console
   - Select User Pool: `us-east-1_4jqF97H2X`
   - Navigate to "App integration" → "App clients"
   - Select client: `1ooqafj1v6bh3ff55t2ha56hn4`

2. **Configure Hosted UI**
   - Click "Edit" in the Hosted UI section
   - Enable "Hosted UI"
   - Configure the following settings:

```json
{
  "domain": "https://us-east-14jqf97h2x.auth.us-east-1.amazoncognito.com",
  "app_client_name": "IAprender",
  "css_customization": {
    "primary_color": "#2563eb",
    "secondary_color": "#4f46e5",
    "background_color": "#f8fafc",
    "text_color": "#1e293b",
    "link_color": "#2563eb",
    "border_color": "#e2e8f0",
    "error_color": "#dc2626",
    "success_color": "#16a34a"
  },
  "logo_url": "https://39be0399-0121-4891-903c-353f1d3ba9d4-00-23r9t77u2drlf.janeway.replit.dev/assets/IAprender_1750262542315.png",
  "ui_customization": {
    "client_name": "IAprender",
    "client_description": "Plataforma educacional com inteligência artificial"
  }
}
```

3. **Upload Logo**
   - Click "Choose file" for logo
   - Upload the IAprender logo: `IAprender_1750262542315.png`
   - Recommended size: 150x150px

4. **Configure CSS**
   - Add custom CSS in the "CSS customization" section
   - Use the styles from `server/cognito-custom-ui.css`

## CSS Customization for Cognito Hosted UI

### Key Design Elements from /auth Page

1. **Background**: Gradient from slate-50 to blue-50 to indigo-100
2. **Cards**: White background with backdrop blur and rounded corners
3. **Buttons**: Blue gradient with hover effects
4. **Inputs**: Rounded with focus states
5. **Typography**: Modern font stack with proper hierarchy
6. **Animations**: Subtle pulse effects and transitions

### Critical CSS Rules

```css
/* Main container */
.modal-content {
  background: rgba(255, 255, 255, 0.9) !important;
  backdrop-filter: blur(20px);
  border-radius: 24px !important;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
}

/* Buttons */
.btn-primary {
  background: linear-gradient(135deg, #2563eb, #4338ca, #7c3aed) !important;
  border-radius: 16px !important;
  padding: 16px 24px !important;
  font-weight: 700 !important;
}

/* Inputs */
input[type="text"], input[type="email"], input[type="password"] {
  border-radius: 16px !important;
  padding: 16px !important;
  border: 2px solid #e2e8f0 !important;
  background: rgba(255, 255, 255, 0.8) !important;
}
```

## Testing the Implementation

1. **Test the Login Flow**
   - Go to: `/start-login` on your application
   - Verify the custom styling is applied
   - Complete the authentication flow
   - Confirm redirection works correctly

2. **Verify Styling**
   - Check logo display
   - Verify color scheme matches `/auth` page
   - Test responsive design
   - Confirm animations work

3. **Test Different Scenarios**
   - New user registration
   - Existing user login
   - Error handling
   - Password reset flow

## Custom CSS Files

The following files have been created for your customization:

1. **`server/cognito-custom-ui.css`** - Main styling file
2. **`server/routes/cognito-custom-ui.ts`** - Route handler for serving custom assets
3. **Updated CognitoService** - Enhanced with custom URL generation

## Environment Variables

Ensure these environment variables are set:

```bash
COGNITO_DOMAIN=https://us-east-14jqf97h2x.auth.us-east-1.amazoncognito.com
COGNITO_CLIENT_ID=1ooqafj1v6bh3ff55t2ha56hn4
COGNITO_USER_POOL_ID=us-east-1_4jqF97H2X
COGNITO_REDIRECT_URI=https://39be0399-0121-4891-903c-353f1d3ba9d4-00-23r9t77u2drlf.janeway.replit.dev/auth/callback
```

## Support and Troubleshooting

### Common Issues

1. **CSS Not Loading**
   - Verify the CSS file is accessible
   - Check CORS settings
   - Ensure proper content-type headers

2. **Logo Not Displaying**
   - Verify logo URL is publicly accessible
   - Check file format (PNG, JPG, or SVG)
   - Ensure proper image dimensions

3. **Custom Domain Issues**
   - Verify DNS configuration
   - Check SSL certificate
   - Confirm domain ownership

### Debug URLs

- CSS: `https://your-domain.com/cognito-ui/cognito-custom-ui.css`
- JS: `https://your-domain.com/cognito-ui/cognito-custom-ui.js`
- Logo: `https://your-domain.com/assets/IAprender_1750262542315.png`

## Conclusion

The custom CSS approach provides the best balance between customization and maintenance. While AWS Cognito hosted UI has limitations, the provided solution closely matches the existing `/auth` page design and maintains the IAprender branding.

For the most seamless user experience, consider implementing the custom authentication page approach, which gives you complete control over the UI while still leveraging Cognito for authentication.