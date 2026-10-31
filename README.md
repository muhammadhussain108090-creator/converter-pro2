# ConvertPro - Modern Client-Side PDF & Image Conversion Suite

ConvertPro is a high-performance, privacy-first PDF and image conversion platform built with React 19, Vite, TypeScript, Tailwind CSS, PDF-lib, and Firebase Authentication.

All conversion algorithms execute **100% in-browser** using client-side WebAssembly, Canvas, and binary ArrayBuffers. User documents and images are never transmitted or stored on remote servers.

---

## 🛠️ Complete Feature Matrix

### 1. PDF Tools
- **Merge PDF**: Combine multiple PDF documents with drag-and-drop reordering.
- **Split PDF**:
  - Extract specific page ranges (e.g. `1-3, 5, 8-10`).
  - Split all pages into individual PDFs packed into a `.zip` archive.
  - Split every *N* pages into chunked PDF archives.
- **Rotate PDF**: Rotate all pages, odd pages only, even pages only, or custom pages by 90°, 180°, or 270° clockwise.
- **Extract PDF Pages**: Select specific pages to pull out into a clean new PDF document.
- **Delete PDF Pages**: Remove unwanted or blank pages while keeping remaining pages intact.
- **PDF Metadata Editor**: Inspect and edit technical document properties (Title, Author, Subject, Keywords).
- **Images to PDF**: Convert multiple JPG, PNG, and WebP pictures into a single multi-page PDF with customizable page sizes (Fit, A4, US Letter), orientation (Auto, Portrait, Landscape), and margins.

### 2. Image Tools
- **Compress Image**: Quality slider (10% to 95%), format selection (WebP, JPG), constraint max width, and real-time savings % calculator.
- **Resize Image**: Pixel dimension inputs with aspect ratio lock, and quick presets (Full HD 1920x1080, HD 1280x720, Square 800x800, Avatar 400x400).
- **Convert Image**: Lossless/lossy format conversion between JPG, PNG, and WebP with alpha-transparency handling.
- **Crop Image**: Interactive cropping with aspect ratio presets (1:1 Square, 16:9 Cinema, 4:3 Standard, Freeform).

### 3. Document Tools
- **Word to PDF**: Client-side extraction of text, headings, and structure from `.docx` files using Mammoth and PDF-lib rendering.
- **PDF to Word**: Extraction of document text and structural pages into an editable Word document format (`.doc`) compatible with Microsoft Word and Google Docs.

### 4. Firebase Authentication & User Dashboard
- **Sign Up**: Name, email, password with live strength validation meter.
- **Email Verification**: Automatic verification link dispatch on registration and one-click resend.
- **Login**: Email and password with persistent sessions.
- **Google Sign-In**: Instant popup authentication.
- **Password Reset**: Forgot password flow with email link.
- **User Dashboard**: Profile management, name updating, verified email status badge, and conversion activity history log.
- **Zero-Config Graceful Degradation**: If Firebase is not yet configured, the app seamlessly runs in guest mode with local browser storage.

---

## 🚀 How to Run Locally

### 1. Prerequisites
- Node.js version 18 or newer
- npm or pnpm

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your Firebase credentials (optional for testing, required for cloud sync):
```env
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"
```

### 4. Start the Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your web browser.

### 5. Run Unit Tests
```bash
npx --yes tsx --test src/utils/pureLogic.test.ts
```

---

## 🔥 How to Configure Firebase

1. Open the [Firebase Console](https://console.firebase.google.com/) and create a project.
2. In the project dashboard, click **Add app** and select the **Web (</>)** platform.
3. Copy the configuration object keys into your `.env.local` or Netlify environment settings.
4. Enable **Authentication**:
   - Go to **Build → Authentication → Sign-in method**.
   - Enable **Email/Password** (Email link optional).
   - Enable **Google** provider.
5. Enable **Cloud Firestore**:
   - Go to **Build → Firestore Database** and click **Create database**.
   - Start in test mode or paste the rules from `firestore.rules`.
6. Deploy `firestore.rules` to ensure secure user-isolated access:
```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /conversions/{conversionId} {
        allow read, create, delete: if request.auth != null && request.auth.uid == userId;
        allow update: if false;
      }
    }
  }
}
```

---

## 🌐 How to Deploy on Netlify

### Method A: Connect Git Repository (Recommended)
1. Push your ConvertPro repository to GitHub, GitLab, or Bitbucket.
2. Log in to [Netlify](https://app.netlify.com/) and click **Add new site → Import an existing project**.
3. Select your repository. Netlify automatically detects the included `netlify.toml` file:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. Under **Site configuration → Environment variables**, add your Firebase variables:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
5. Click **Deploy Site**.

### Method B: Netlify CLI
```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

---

## 🐙 How to Deploy on GitHub Pages

ConvertPro is pre-configured with relative base paths (`base: './'`), SPA 404 routing, and an automated GitHub Actions deployment workflow (`.github/workflows/deploy.yml`).

### Step-by-Step Setup:
1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Configure GitHub Pages deployment"
   git push origin main
   ```
2. **Enable GitHub Actions for Pages**:
   - Go to your repository on GitHub.
   - Click on **Settings** → **Pages** (under "Code and automation").
   - Under **Build and deployment** → **Source**, select **GitHub Actions**.
3. **Configure Firebase Authorized Domains**:
   - Go to the [Firebase Console](https://console.firebase.google.com/) → **Authentication** → **Settings** → **Authorized domains**.
   - Add your GitHub Pages domain: `<username>.github.io`.
4. **Trigger Deployment**:
   - Whenever you push to `main` (or `master`), the workflow in `.github/workflows/deploy.yml` will automatically build the project and deploy the `dist` bundle.
   - You can track the status in the **Actions** tab of your repository.
   - Your live site will be accessible at: `https://<username>.github.io/<repository-name>/`.

---

## 🔍 Features Requiring Backend or Cloud Configuration

ConvertPro was intentionally engineered to run entirely client-side without costly server infrastructure. However, certain enterprise document operations inherently require specialized server engines:

1. **Complex DOCX with Macros & SmartArt**:
   - Client-side Mammoth converts standard headings, paragraphs, bold/italic formatting, and lists.
   - Proprietary Microsoft Word macros, vector drawing canvas shapes, and legacy binary `.doc` format require a backend running a headless LibreOffice / Collabora engine or dedicated Cloud Convert API.
2. **Scanned PDF OCR (Optical Character Recognition)**:
   - Client-side conversion reads text streams from standard digital PDFs.
   - For flattened scans (photographs of pages inside a PDF), a backend OCR engine (e.g. Tesseract.js in a Web Worker or Google Cloud Vision API) is needed to extract text.
3. **Adobe Acrobat 256-bit AES Password Encryption**:
   - Full standard PDF user/owner encryption dictionaries require heavy crypto binary libraries. Basic permissions and metadata protection are implemented natively in ConvertPro.
