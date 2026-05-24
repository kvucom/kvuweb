# AI Video Script - Krishi Vikas Udyog Deployment Plan

## Complete Narration Script + AI Tool Guide

---

## PART 1: Video Narration Script

### Scene 1: Cover Slide (0:00 - 0:15)
**Visual:** Title slide with project name
**Voiceover:**
"Welcome to the complete deployment plan for Krishi Vikas Udyog - a production-ready full-stack web application. In this video, I'll walk you through deploying both frontend and backend with your custom domain, completely free."

### Scene 2: Agenda (0:15 - 0:30)
**Visual:** Agenda slide
**Voiceover:**
"Here's what we'll cover: Architecture overview, pre-deployment checklist, Vercel deployment, domain configuration, Supabase security setup, testing, and cost breakdown. Let's dive in."

### Scene 3: Architecture Overview (0:30 - 1:00)
**Visual:** Tech stack + deployment flow diagram
**Voiceover:**
"Our application uses React 19 with TypeScript and Vite for the frontend, styled with Tailwind CSS. The backend runs on Supabase - a PostgreSQL database with built-in authentication and storage. For emails, we use EmailJS. The deployment flow is simple: users connect through Cloudflare DNS, which routes to Vercel for the frontend, and Vercel communicates with Supabase for all backend operations."

### Scene 4: Phase 1 - Pre-Deployment (1:00 - 1:45)
**Visual:** Environment variables + build commands
**Voiceover:**
"Before deploying, we need to set up environment variables. These include your Supabase URL and anonymous key, plus EmailJS credentials for the contact form. Run npm install to get dependencies, then npm run build to verify everything compiles correctly. Finally, push your code to GitHub - but make sure your .env file is in .gitignore so secrets don't get exposed."

### Scene 5: Phase 2 - Vercel Deploy (1:45 - 2:30)
**Visual:** Vercel dashboard steps
**Voiceover:**
"Now let's deploy to Vercel. Sign up at vercel.com using your GitHub account. Click 'New Project', import your repository, and Vercel will auto-detect it's a Vite project. The build command is 'npm run build' and output directory is 'dist'. After the initial deploy, go to Project Settings and add all your environment variables. Then trigger a redeploy to apply them."

### Scene 6: Phase 3 - Domain Setup (2:30 - 3:15)
**Visual:** DNS configuration table
**Voiceover:**
"Time to connect your custom domain. In Vercel, go to Project Settings, then Domains, and add your domain name. For DNS, we recommend Cloudflare for free SSL and DDoS protection. Add two CNAME records: one for the root domain pointing to cname.vercel-dns.com, and another for www pointing to the same. Set SSL mode to Full Strict, and Vercel will automatically provision your SSL certificate."

### Scene 7: Phase 4 - Supabase Security (3:15 - 4:00)
**Visual:** RLS policies + storage buckets
**Voiceover:**
"Security is critical. In Supabase, enable Row Level Security on all tables. Create policies that allow public read access for products, images, and reviews, but restrict write operations to authenticated users only. Set up three storage buckets: product-images, site-images, and media-reviews - all public for reading, but only authenticated users can upload. Finally, create an admin user in the Authentication section."

### Scene 8: Phase 5 - Testing (4:00 - 4:30)
**Visual:** Testing checklist
**Voiceover:**
"After deployment, test everything. Verify the homepage loads, products display from Supabase, the contact form sends emails, and language switching works. Test the admin panel login, CRUD operations, and image uploads. Run a PageSpeed test - you should score above 80. Confirm HTTPS is active and all admin routes are protected."

### Scene 9: Cost Breakdown (4:30 - 4:50)
**Visual:** Cost table with FREE highlighted
**Voiceover:**
"Here's the best part - the entire setup is completely free. Vercel Hobby plan gives you 100GB bandwidth, Supabase Free tier includes 500MB database and 1GB storage, Cloudflare is free forever, and EmailJS gives you 200 emails per month. Total cost: zero rupees per month."

### Scene 10: Future Scaling (4:50 - 5:15)
**Visual:** Scaling table + quick links
**Voiceover:**
"When your traffic grows, you can upgrade. Vercel Pro is $20 per month, Supabase Pro is $25, and EmailJS Growth is $10 - totaling about $55 or 4,500 rupees per month. But for now, the free tier will serve you perfectly. Quick links are in the description. Thanks for watching!"

---

## PART 2: AI Video Tool Guide

### Option A: Canva AI (Recommended - Free)

#### Step 1: Create Account
1. Go to canva.com
2. Sign up with Google or email
3. Choose "Video" format (1920x1080)

#### Step 2: Import Presentation
1. Click "Uploads" → Upload `deployment-plan-ppt.html` screenshots
2. Or recreate slides using Canva templates
3. Search "Technology Presentation" templates

#### Step 3: Add AI Voiceover
1. Click "Apps" on left sidebar
2. Search "Murf AI" or "Voiceover"
3. Paste narration script for each slide
4. Choose voice: "Professional Male" or "Professional Female"
5. Adjust speed: 0.9x for clarity

#### Step 4: Add Animations
1. Select each element
2. Click "Animate" → Choose "Fade" or "Rise"
3. Duration: 0.5s per element
4. Add transitions between slides: "Dissolve"

#### Step 5: Export
1. Click "Share" → "Download"
2. Format: MP4 Video
3. Quality: 1080p
4. Wait for processing (5-10 minutes)

---

### Option B: InVideo AI (Free Trial)

#### Step 1: Create Account
1. Go to invideo.io
2. Sign up for free trial
3. Choose "AI Text to Video"

#### Step 2: Input Script
1. Paste the complete narration script
2. Select category: "Technology" or "Tutorial"
3. Choose aspect ratio: 16:9 (YouTube)

#### Step 3: Customize
1. AI will auto-generate scenes
2. Replace stock footage with your screenshots
3. Edit text overlays
4. Adjust timing per scene

#### Step 4: Voiceover
1. Choose AI Voice from library
2. Recommended: "Marcus" or "Sara"
3. Set pace: Medium
4. Preview and adjust

#### Step 5: Export
1. Click "Export"
2. Resolution: 1080p
3. Free version has watermark
4. Upgrade for watermark-free ($20/month)

---

### Option C: Pictory AI (Free Trial)

#### Step 1: Create Account
1. Go to pictory.ai
2. Start free trial
3. Choose "Script to Video"

#### Step 2: Paste Script
1. Copy narration script scene by scene
2. Pictory auto-generates visuals
3. Replace with custom images if needed

#### Step 3: Voiceover
1. Select AI Voice
2. Choose language: English (Indian accent available)
3. Adjust speed and tone

#### Step 4: Edit
1. Trim scenes
2. Add captions (auto-generated)
3. Add background music (optional)

#### Step 5: Export
1. Download in 1080p
2. Free trial: 3 videos
3. Paid: $19/month

---

## PART 3: Quick Tips for Best Results

### Voiceover Tips
- Speak clearly and at moderate pace
- Pause between sections
- Use a quiet room
- Test mic before recording

### Visual Tips
- Use high-contrast colors
- Keep text minimal on screen
- Use animations sparingly
- Add your logo watermark

### Audio Tips
- Background music at 10% volume
- Remove echo/noise
- Normalize audio levels
- Add intro/outro music

### Export Settings
- Resolution: 1920x1080 (Full HD)
- Frame rate: 30 fps
- Format: MP4 (H.264)
- Bitrate: 8-12 Mbps

---

## PART 4: Free Resources

### Stock Footage (If Needed)
- Pexels.com - Free videos
- Pixabay.com - Free clips
- Coverr.co - Free backgrounds

### Music
- YouTube Audio Library - Free
- Bensound.com - Free with attribution
- Freesound.org - Sound effects

### Icons & Graphics
- Flaticon.com - Free icons
- Undraw.co - Free illustrations
- Heroicons.com - Open source icons

---

**Total Video Length:** ~5 minutes 15 seconds
**Recommended Platform:** YouTube, LinkedIn, Portfolio
**Target Audience:** Clients, Employers, Developers

---

**Script Version:** 1.0  
**Created:** May 22, 2026  
**By:** Safwan Raza
