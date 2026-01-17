# Piper TTS Setup Guide

This guide explains how to set up Piper TTS (free, open-source text-to-speech) for the Flame plan voice generation.

## Overview

Piper TTS is a fast, local, neural text-to-speech system that runs entirely on your machine - no API keys or external services required.

## Installation Steps

### 1. Download Piper

#### Windows:
1. Go to [Piper Releases](https://github.com/rhasspy/piper/releases)
2. Download `piper_windows_amd64.tar.gz` (or appropriate version for your system)
3. Extract the archive
4. Copy `piper.exe` to your project: `tools/piper/piper.exe`

#### Linux:
```bash
# Download and extract
wget https://github.com/rhasspy/piper/releases/download/v1.2.0/piper_amd64.tar.gz
tar -xzf piper_amd64.tar.gz
mv piper tools/piper/
```

#### macOS:
```bash
# Download and extract
wget https://github.com/rhasspy/piper/releases/download/v1.2.0/piper_macos_amd64.tar.gz
tar -xzf piper_macos_amd64.tar.gz
mv piper tools/piper/
```

### 2. Download Voice Model

1. Go to [Piper Voices](https://huggingface.co/rhasspy/piper-voices/tree/main/en)
2. Download a voice model (recommended: `en_US-libritts-high.onnx`)
3. Create directory: `tools/piper/voices/`
4. Place the `.onnx` file in `tools/piper/voices/`

Example:
```
tools/
  piper/
    piper.exe (or piper on Linux/Mac)
    voices/
      en_US-libritts-high.onnx
```

### 3. Configure Environment Variables

Add to `.env.local`:

```env
# Piper TTS Configuration
PIPER_PATH=./tools/piper/piper.exe  # Windows
# PIPER_PATH=./tools/piper/piper     # Linux/Mac

PIPER_VOICE_MODEL=./tools/piper/voices/en_US-libritts-high.onnx
PIPER_OUTPUT_DIR=./public/audio
```

### 4. Test Installation

Test Piper manually:

```bash
# Windows
echo "Hello, this is a test" | tools\piper\piper.exe --model tools\piper\voices\en_US-libritts-high.onnx --output_file test.wav

# Linux/Mac
echo "Hello, this is a test" | ./tools/piper/piper --model ./tools/piper/voices/en_US-libritts-high.onnx --output_file test.wav
```

If successful, you should see a `test.wav` file generated.

### 5. Verify in Application

The application will automatically check if Piper is available when generating voice for Flame plan users. If not available, the system will continue without voice (email will still be sent).

## Directory Structure

```
project-root/
  tools/
    piper/
      piper.exe (or piper)
      voices/
        en_US-libritts-high.onnx
  public/
    audio/          # Generated audio files stored here
  lib/
    services/
      piper-tts.ts  # Piper TTS service
```

## Troubleshooting

### Issue: "Piper TTS is not available"

**Solution:**
1. Check that `piper.exe` (or `piper`) exists at the configured path
2. Check that the voice model `.onnx` file exists
3. Verify file permissions (executable on Linux/Mac)
4. Check environment variables in `.env.local`

### Issue: Audio files not generated

**Solution:**
1. Check console logs for error messages
2. Verify `public/audio` directory exists and is writable
3. Test Piper manually (see step 4 above)
4. Check disk space

### Issue: Slow audio generation

**Solution:**
- This is normal - Piper runs locally and may take a few seconds
- Consider running audio generation as a background job
- For production, consider caching frequently used phrases

## Alternative Voice Models

You can use different voice models from [Piper Voices](https://huggingface.co/rhasspy/piper-voices):

- `en_US-libritts-high.onnx` - High quality, natural (recommended)
- `en_US-lessac-medium.onnx` - Medium quality, faster
- `en_US-amy-medium.onnx` - Alternative voice

Update `PIPER_VOICE_MODEL` in `.env.local` to use a different model.

## Production Considerations

1. **Background Processing**: Generate audio files asynchronously to avoid blocking requests
2. **Caching**: Cache generated audio for similar questions
3. **Storage**: Use cloud storage (Supabase Storage, S3) for audio files instead of local filesystem
4. **CDN**: Serve audio files via CDN for faster delivery
5. **Cleanup**: Implement cleanup job to remove old audio files

## Resources

- [Piper GitHub](https://github.com/rhasspy/piper)
- [Piper Voices](https://huggingface.co/rhasspy/piper-voices)
- [Piper Documentation](https://github.com/rhasspy/piper#readme)
