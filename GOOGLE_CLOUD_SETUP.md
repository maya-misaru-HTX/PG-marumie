# Google Cloud Vision API Setup Guide

This application uses Google Cloud Vision API for high-quality Japanese OCR with support for files up to 20MB.

## Why Google Cloud Vision?

- ✅ Supports files up to 20MB (vs 1MB with free OCR.space)
- ✅ Excellent Japanese text recognition accuracy
- ✅ Free tier: First 1,000 pages per month
- ✅ Pay-as-you-go: $1.50 per 1,000 pages after free tier

## Setup Steps

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID

### 2. Enable Cloud Vision API

1. In your project, go to **APIs & Services** → **Library**
2. Search for "Cloud Vision API"
3. Click **Enable**

### 3. Create Service Account

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **Service Account**
3. Fill in:
   - Service account name: `political-funds-ocr`
   - Service account ID: (auto-generated)
   - Click **Create and Continue**
4. Grant role: **Cloud Vision API User**
5. Click **Done**

### 4. Generate Service Account Key

1. In **Credentials** page, find your service account
2. Click on the service account email
3. Go to **Keys** tab
4. Click **Add Key** → **Create new key**
5. Choose **JSON** format
6. Click **Create** - a JSON file will download

### 5. Configure Environment Variables

#### Option A: For Local Development

Create `.env.local` file in project root:

```bash
# Copy the path to your downloaded JSON file
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your-service-account-key.json
```

#### Option B: For Vercel/Production Deployment

1. Open your downloaded JSON file
2. Copy the entire JSON content (minify to single line)
3. In Vercel dashboard:
   - Go to your project → **Settings** → **Environment Variables**
   - Add new variable:
     - Name: `GOOGLE_CREDENTIALS`
     - Value: Paste the entire JSON content
     - Click **Save**
4. Redeploy your application

Example of minified JSON format:
```
{"type":"service_account","project_id":"your-project-123","private_key_id":"abc123",...}
```

### 6. Test the Setup

1. Restart your development server: `npm run dev`
2. Upload a PDF file (up to 20MB)
3. Check the console for:
   - ✅ Success: Using Google Cloud Vision
   - ⚠️ Warning: Falling back to OCR.space (if credentials not configured)

## Costs

- **Free tier**: 1,000 pages/month
- **After free tier**: $1.50 per 1,000 pages
- **File size**: Up to 20MB per file

For a typical political funds report (50-100 pages), you'll use:
- Free tier: Can process ~10-20 reports per month
- Cost after: ~$0.08-0.15 per report

## Fallback Behavior

If Google Cloud credentials are not configured, the system automatically falls back to:
- **OCR.space Free API**
  - 1MB file size limit
  - 25,000 requests/month
  - Good for small files

## Troubleshooting

### Error: "Could not load the default credentials"

**Solution**: Make sure you've set either `GOOGLE_APPLICATION_CREDENTIALS` or `GOOGLE_CREDENTIALS` environment variable.

### Error: "Permission denied"

**Solution**: Ensure your service account has the "Cloud Vision API User" role.

### Warning: "Falling back to OCR.space"

**Explanation**: This means Google Cloud credentials are not configured. The app will use OCR.space (1MB limit) instead.

## Security Notes

- ⚠️ Never commit your service account JSON file to Git
- ⚠️ Add `.env.local` to `.gitignore` (already configured)
- ⚠️ Use environment variables for production deployment
- ✅ Rotate your service account keys periodically
