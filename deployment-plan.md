# Krishi Vikas Udyog - Complete Deployment Plan

## Production-Ready Full Stack Setup
**Frontend + Backend + Domain + Security**

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Phase 1: Pre-Deployment Checklist](#2-phase-1-pre-deployment-checklist)
3. [Phase 2: Frontend Deploy on Vercel](#3-phase-2-frontend-deploy-on-vercel)
4. [Phase 3: Domain DNS Configuration](#4-phase-3-domain-dns-configuration)
5. [Phase 4: Supabase Security](#5-phase-4-supabase-security)
6. [Phase 5: Post-Deployment Testing](#6-phase-5-post-deployment-testing)
7. [Cost Breakdown](#7-cost-breakdown)
8. [Future Scaling](#8-future-scaling)

---

## 1. Architecture Overview

### Current Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19 + TypeScript + Vite | UI Framework & Build Tool |
| **Styling** | Tailwind CSS 3 | Utility-first CSS |
| **Routing** | React Router v7 | Client-side routing |
| **Animations** | Framer Motion | Smooth animations |
| **i18n** | i18next + react-i18next | Multi-language (EN/HI) |
| **Backend/DB** | Supabase (PostgreSQL) | Database, Auth, Storage |
| **Email** | EmailJS | Contact form emails |
| **Icons** | Lucide React + Material Symbols | UI Icons |

### Deployment Architecture

```
END USERS
    |
    v
Cloudflare DNS + CDN (Free SSL, DDoS Protection)
    |
    v
Vercel (Frontend - Global CDN, Auto Builds)
    |
    v
Supabase (Backend - PostgreSQL, Auth, Storage)
```

---

## 2. Phase 1: Pre-Deployment Checklist

### 2.1 Environment Variables Setup

Create `.env` file in project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
VITE_EMAILJS_SERVICE_ID=your_emailjs_service_id
VITE_EMAILJS_TEMPLATE_ID=your_emailjs_template_id
```

### 2.2 Build Verification

```bash
npm install
npx tsc -b
npm run build
npm run preview
```

### 2.3 GitHub Repository Setup

```bash
git init
git remote add origin https://github.com/your-username/krishi-vikas-web.git
git add .
git commit -m "Initial production build"
git push -u origin main
```

---

## 3. Phase 2: Frontend Deploy on Vercel

### 3.1 Create Vercel Account
1. Go to vercel.com
2. Sign up with GitHub
3. Authorize repository access

### 3.2 Deploy Project
1. Click "New Project"
2. Import GitHub repository
3. Configure build settings:
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 3.3 Add Environment Variables
Go to: Project Settings → Environment Variables

Add: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_EMAILJS keys

### 3.4 Redeploy
Trigger new deployment after adding env variables.

---

## 4. Phase 3: Domain DNS Configuration

### 4.1 Add Domain to Vercel
1. Project Settings → Domains
2. Enter domain (e.g., krishivikasudyog.in)
3. Click "Add"

### 4.2 Configure DNS (Cloudflare Recommended)

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| CNAME | @ | cname.vercel-dns.com | DNS only |
| CNAME | www | cname.vercel-dns.com | DNS only |

SSL/TLS mode: Full (Strict)

---

## 5. Phase 4: Supabase Security

### 5.1 RLS Policies

```sql
-- Products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view products" ON products FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage products" ON products FOR ALL USING (auth.role() = 'authenticated');

-- Site Images
ALTER TABLE site_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view site images" ON site_images FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage site images" ON site_images FOR ALL USING (auth.role() = 'authenticated');

-- Media Reviews
ALTER TABLE media_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view media reviews" ON media_reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage media reviews" ON media_reviews FOR ALL USING (auth.role() = 'authenticated');

-- Popup Campaigns
ALTER TABLE popup_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active campaigns" ON popup_campaigns FOR SELECT USING (status = 'active');
CREATE POLICY "Authenticated users can manage campaigns" ON popup_campaigns FOR ALL USING (auth.role() = 'authenticated');
```

### 5.2 Storage Buckets
- Create: product-images, site-images, media-reviews (all public)
- Add policies for public read, authenticated write

### 5.3 Admin User
Create admin user in Supabase → Authentication → Users

---

## 6. Phase 5: Post-Deployment Testing

### Checklist
- Homepage loads correctly
- Products display from Supabase
- Contact form works (EmailJS)
- Language switch (EN/HI) works
- Mobile responsive
- Admin login works
- CRUD operations in admin panel
- HTTPS enabled
- PageSpeed score > 80

---

## 7. Cost Breakdown

| Service | Plan | Monthly Cost |
|---------|------|--------------|
| Vercel | Hobby | FREE |
| Supabase | Free | FREE |
| Cloudflare | Free | FREE |
| EmailJS | Free | FREE |
| **Total** | | **₹0/month** |

---

## 8. Future Scaling

| Upgrade | Cost |
|---------|------|
| Vercel Pro | $20/month |
| Supabase Pro | $25/month |
| EmailJS Growth | $10/month |
| **Total Pro** | **~$55/month** |

---

**Document Version:** 1.0  
**Last Updated:** May 22, 2026  
**Prepared by:** Safwan Raza
