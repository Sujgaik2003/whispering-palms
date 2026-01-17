# Vercel Deployment Guide

## 1. Push Code to GitHub

Since I cannot directly create a repository on your GitHub account, please follow these steps:

1.  **Create a New Repository**:
    *   Go to [GitHub.com](https://github.com/new).
    *   Name it `whispering-palms` (or `AIASTRO`).
    *   **Do not** initialize with README, .gitignore, or License (since we already have them).
    *   Click "Create repository".

2.  **Push Local Code**:
    Run the following commands in your terminal (The repository is already initialized and the remote is added):

    ```bash
    # Push the main branch (Production)
    git push -u origin main

    # Push the development branch
    git push -u origin whispering-palms-dev
    ```

## 2. Deploy on Vercel

1.  **Log in to Vercel**: Go to [vercel.com](https://vercel.com) and log in.
2.  **Add New Project**:
    *   Click "Add New..." -> "Project".
    *   **Import Git Repository**: Select the `whispering-palms` repo you just created.
3.  **Configure Project**:
    *   **Framework Preset**: It should auto-detect "Next.js".
    *   **Root Directory**: `./` (Default).
    *   **Environment Variables**:
        *   Open your local `.env` or `.env.local` file.
        *   Copy each key-value pair into the Vercel Environment Variables section.
        *   **Important**: Add these variables:
            *   `NEXT_PUBLIC_SUPABASE_URL`
            *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
            *   Any other API keys you use (e.g., `GOOGLE_CLIENT_ID`, `OPENAI_API_KEY`).
4.  **Deploy**: Click "Deploy".

## 3. Branches & CI/CD Setup

You asked for a pipeline where `main` goes live automatically.

*   **Vercel Automatically handles this**:
    *   When you push to `main`: Vercel creates a **Production Deployment**.
    *   When you push to `whispering-palms-dev`: Vercel creates a **Preview Deployment** (with a unique URL for testing).
    
*   **Workflow**:
    1.  Develop features on `whispering-palms-dev`.
    2.  Test the "Preview" URL Vercel gives you.
    3.  When ready, create a Pull Request on GitHub from `whispering-palms-dev` to `main`.
    4.  Merge the PR. Vercel will automatically build and update the live site.

## 4. Supabase Configuration

*   Ensure your Supabase project allows requests from your Vercel domain.
*   Go to Supabase -> Authentication -> URL Configuration.
*   Add your Vercel production URL (e.g., `https://whispering-palms.vercel.app`) to "calback URLs" and "Redirect URLs".
