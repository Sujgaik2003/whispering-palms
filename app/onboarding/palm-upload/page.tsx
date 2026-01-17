'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Toast from '../../components/Toast'
import LanguageSwitcher from '@/app/components/LanguageSwitcher'
import { useI18n } from '@/app/hooks/useI18n'

type PalmType = 'right_front' | 'left_front'

interface UploadedImage {
  id: string
  palmType: PalmType
  file: File
  preview: string
  uploading: boolean
  error?: string
}

export default function PalmUploadPage() {
  const router = useRouter()
  const { t } = useI18n()
  
  const PALM_TYPES: { value: PalmType; label: string; description: string }[] = [
    { value: 'right_front', label: t('palm.rightPalm'), description: t('palm.rightPalmDesc') },
    { value: 'left_front', label: t('palm.leftPalm'), description: t('palm.leftPalmDesc') },
  ]
  const fileInputRefs = useRef<{ [key in PalmType]?: HTMLInputElement }>({})
  const cameraInputRefs = useRef<{ [key in PalmType]?: HTMLInputElement }>({})
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [uploading, setUploading] = useState(false)
  const [matchingStatus, setMatchingStatus] = useState<{
    status: string
    confidence: number
    message: string
  } | null>(null)
  const [matchingInProgress, setMatchingInProgress] = useState(false)
  const [cameraActive, setCameraActive] = useState<{ palmType: PalmType | null }>({ palmType: null })
  const [cameraReady, setCameraReady] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info'; isVisible: boolean }>({
    message: '',
    type: 'info',
    isVisible: false,
  })

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToast({ message, type, isVisible: true })
  }

  const handleFileSelect = async (palmType: PalmType, file: File | null) => {
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      showToast(t('palm.invalidFileType'), 'error')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast(t('palm.fileTooLarge'), 'error')
      return
    }

    const preview = URL.createObjectURL(file)
    const uploadId = Date.now().toString()

    const newImage: UploadedImage = {
      id: uploadId,
      palmType,
      file,
      preview,
      uploading: false,
    }

    setUploadedImages(prev => {
      const filtered = prev.filter(img => img.palmType !== palmType)
      return [...filtered, newImage]
    })

    await uploadImage(newImage)
  }

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)

      img.onload = () => {
        URL.revokeObjectURL(url)
        if (img.width > 0 && img.height > 0) {
          resolve({ width: img.width, height: img.height })
        } else {
          resolve({ width: 1200, height: 1600 })
        }
      }

      img.onerror = () => {
        URL.revokeObjectURL(url)
        resolve({ width: 1200, height: 1600 })
      }

      setTimeout(() => {
        URL.revokeObjectURL(url)
        resolve({ width: 1200, height: 1600 })
      }, 5000)

      img.src = url
    })
  }

  const uploadImage = async (image: UploadedImage) => {
    setUploadedImages(prev =>
      prev.map(img =>
        img.id === image.id ? { ...img, uploading: true, error: undefined } : img
      )
    )

    try {
      const dimensions = await getImageDimensions(image.file)

      if (!dimensions.width || !dimensions.height || dimensions.width === 0 || dimensions.height === 0) {
        throw new Error(t('palm.uploadFailed'))
      }

      const formData = new FormData()
      formData.append('file', image.file)
      formData.append('palm_type', image.palmType)
      formData.append('width', dimensions.width.toString())
      formData.append('height', dimensions.height.toString())

      const response = await fetch('/api/user/profile/palm-images', {
        method: 'POST',
        body: formData,
      })

      let result
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        result = await response.json()
      } else {
        const text = await response.text()
        try {
          result = JSON.parse(text)
        } catch {
          throw new Error(text || t('palm.uploadFailed'))
        }
      }

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        throw new Error(result.error?.message || result.message || t('palm.uploadFailed'))
      }

      setUploadedImages(prev => {
        const updated = prev.map(img =>
          img.id === image.id
            ? { ...img, uploading: false, id: result.data.palmImage.id }
            : img
        )

        const hasRight = updated.some(img => img.palmType === 'right_front' && img.id && img.id.length > 20)
        const hasLeft = updated.some(img => img.palmType === 'left_front' && img.id && img.id.length > 20)

        if (hasRight && hasLeft) {
          setTimeout(() => triggerMatching(), 100)
        }

        return updated
      })
    } catch (error) {
      setUploadedImages(prev =>
        prev.map(img =>
          img.id === image.id
            ? {
              ...img,
              uploading: false,
              error: error instanceof Error ? error.message : t('palm.uploadFailed'),
            }
            : img
        )
      )
    }
  }

  const removeImage = async (imageId: string, palmType: PalmType) => {
    const image = uploadedImages.find(img => img.id === imageId)
    if (image && image.id && image.id.length > 20) {
      try {
        await fetch(`/api/user/profile/palm-images/${imageId}`, {
          method: 'DELETE',
        })
      } catch (error) {
        console.error('Failed to delete from server:', error)
      }
    }

    setUploadedImages(prev => {
      const filtered = prev.filter(img => img.id !== imageId)

      if (palmType === 'right_front' || palmType === 'left_front') {
        setMatchingStatus(null)
      }

      return filtered
    })
    URL.revokeObjectURL(image?.preview || '')

    if (fileInputRefs.current[palmType]) {
      fileInputRefs.current[palmType]!.value = ''
    }
  }

  const triggerMatching = async () => {
    setMatchingInProgress(true)
    setMatchingStatus(null)

    try {
      const response = await fetch('/api/palm-matching/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        let errorMessage = t('palm.matchingFailed')
        try {
          const errorResult = await response.json()
          errorMessage = errorResult.error?.message || errorResult.message || `HTTP ${response.status}: ${response.statusText}`
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }

        setMatchingStatus({
          status: 'error',
          confidence: 0,
          message: errorMessage,
        })
        return
      }

      const result = await response.json()

      if (result.data?.matching) {
        setMatchingStatus({
          status: result.data.matching.status,
          confidence: result.data.matching.confidence || 0,
          message: result.data.matching.message || t('palm.matchingPalms'),
        })
      } else if (result.error) {
        setMatchingStatus({
          status: 'error',
          confidence: 0,
          message: result.error.message || result.error || t('palm.matchingFailed'),
        })
      } else {
        setMatchingStatus({
          status: 'error',
          confidence: 0,
          message: t('palm.unexpectedResponse'),
        })
      }
    } catch (error) {
      console.error('Error triggering matching:', error)
      const errorMessage = error instanceof Error ? error.message : t('palm.matchingFailed')
      setMatchingStatus({
        status: 'error',
        confidence: 0,
        message: errorMessage,
      })
    } finally {
      setMatchingInProgress(false)
    }
  }

  const handleContinue = async () => {
    const hasRight = uploadedImages.some(img => img.palmType === 'right_front' && img.id && img.id.length > 20)
    const hasLeft = uploadedImages.some(img => img.palmType === 'left_front' && img.id && img.id.length > 20)

    if (!hasRight || !hasLeft) {
      showToast(t('palm.uploadBothPalms'), 'warning')
      return
    }

    const hasErrors = uploadedImages.some(img => img.error)
    const stillUploading = uploadedImages.some(img => img.uploading)

    if (hasErrors) {
      showToast(t('palm.fixUploadErrors'), 'error')
      return
    }

    if (stillUploading) {
      showToast(t('palm.waitForUploads'), 'warning')
      return
    }

    if (!matchingStatus) {
      await triggerMatching()
    }

    if (matchingStatus?.status === 'mismatch') {
      showToast(t('palm.reUploadMismatch'), 'warning')
      return
    }

    router.push('/dashboard')
  }

  const getImageForType = (palmType: PalmType) => {
    return uploadedImages.find(img => img.palmType === palmType)
  }

  const startCamera = async (palmType: PalmType) => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showToast(t('palm.cameraNotAvailable'), 'warning')
        return
      }

      const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      if (!isSecure) {
        showToast(t('palm.httpsRequired'), 'warning')
        return
      }

      let constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      }

      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints)
      } catch (firstError: any) {
        if (firstError.name === 'NotAllowedError' || firstError.name === 'NotFoundError') {
          constraints = {
            video: {
              facingMode: { ideal: 'user' },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          }
          try {
            stream = await navigator.mediaDevices.getUserMedia(constraints)
          } catch (secondError) {
            constraints = {
              video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
            }
            stream = await navigator.mediaDevices.getUserMedia(constraints)
          }
        } else {
          throw firstError
        }
      }
      streamRef.current = stream
      setCameraActive({ palmType })
      setCameraReady(false)
    } catch (error: any) {
      console.error('Error accessing camera:', error)

      let errorMessage = 'Unable to access camera. '

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage += 'Please allow camera permissions:\n\n'
        errorMessage += '1. Click the camera icon in your browser\'s address bar\n'
        errorMessage += '2. Select "Allow" for camera access\n'
        errorMessage += '3. Refresh the page and try again\n\n'
        errorMessage += 'Or use the "Gallery" option to upload from your files.'
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage += 'No camera found. Please connect a camera or use file upload instead.'
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage += 'Camera is already in use by another application. Please close it and try again.'
      } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
        errorMessage += 'Camera does not support the required settings. Please use file upload instead.'
      } else if (error.name === 'NotSupportedError') {
        errorMessage += 'Camera access is not supported in your browser. Please use file upload instead.'
      } else {
        errorMessage += 'Please check your browser permissions or use file upload instead.'
      }

      showToast(errorMessage, 'error')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setCameraActive({ palmType: null })
    setCameraReady(false)
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const capturePhoto = (palmType: PalmType) => {
    if (!videoRef.current) return

    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    const ctx = canvas.getContext('2d')

    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0)
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `palm-${palmType}-${Date.now()}.jpg`, {
            type: 'image/jpeg',
          })
          stopCamera()
          handleFileSelect(palmType, file)
        }
      }, 'image/jpeg', 0.9)
    }
  }

  useEffect(() => {
    if (cameraActive.palmType && videoRef.current && streamRef.current) {
      const video = videoRef.current
      const stream = streamRef.current

      video.srcObject = stream

      const handleCanPlay = () => {
        setCameraReady(true)
      }

      const handlePlaying = () => {
        setCameraReady(true)
      }

      const handleLoadedMetadata = () => {
        video.play().catch(() => { })
      }

      video.addEventListener('canplay', handleCanPlay, { once: true })
      video.addEventListener('playing', handlePlaying, { once: true })
      video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true })

      video.play()
        .then(() => {
          setCameraReady(true)
        })
        .catch(() => { })

      return () => {
        video.removeEventListener('canplay', handleCanPlay)
        video.removeEventListener('playing', handlePlaying)
        video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      }
    }
  }, [cameraActive.palmType])

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  return (
    <main className="min-h-screen bg-gradient-soft p-3 sm:p-4 py-6 sm:py-8 relative">
      <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-50">
        <LanguageSwitcher />
      </div>
      <div className="max-w-4xl mx-auto w-full animate-scale-in px-2 sm:px-4">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-soft-xl border border-beige-300/50">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <Link
                  href="/dashboard"
                  className="p-1.5 sm:p-2 hover:bg-beige-50 rounded-lg transition-colors flex-shrink-0"
                  title={t('settings.backToDashboard')}
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </Link>
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-text-primary font-serif">{t('palm.uploadTitle')}</h1>
                  <p className="text-text-secondary mt-1 text-sm sm:text-base">
                    {t('palm.uploadDesc')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions Section - MOVED TO TOP */}
          {/* Reference Palm Image */}
          <div className="bg-gradient-to-br from-sage-50 to-gold-50 border border-sage-200/50 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-sage-400 to-sage-600 rounded-lg sm:rounded-xl shadow-soft flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-text-primary font-bold text-base sm:text-lg mb-2 sm:mb-3 font-serif">{t('palm.howToPosition')}</h4>
                <p className="text-text-secondary text-xs sm:text-sm mb-3 sm:mb-4">
                  {t('palm.positionGuide')}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-white/80 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-beige-200">
                    <p className="text-text-primary font-semibold text-xs sm:text-sm mb-2 text-center">{t('palm.rightPalmReference')}</p>
                    <div className="bg-gradient-to-br from-beige-100 to-beige-200 rounded-lg p-4 sm:p-6 flex items-center justify-center min-h-[150px] sm:min-h-[200px] border-2 border-dashed border-beige-300">
                      <div className="text-center">
                        <svg className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-2 sm:mb-3 text-sage-600 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
                        </svg>
                        <p className="text-text-tertiary text-[10px] sm:text-xs">{t('palm.palmFlat')}</p>
                        <p className="text-text-tertiary text-[10px] sm:text-xs mt-1">{t('palm.allLinesVisible')}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/80 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-beige-200">
                    <p className="text-text-primary font-semibold text-xs sm:text-sm mb-2 text-center">{t('palm.leftPalmReference')}</p>
                    <div className="bg-gradient-to-br from-beige-100 to-beige-200 rounded-lg p-4 sm:p-6 flex items-center justify-center min-h-[150px] sm:min-h-[200px] border-2 border-dashed border-beige-300">
                      <div className="text-center">
                        <svg className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-2 sm:mb-3 text-sage-600 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ transform: 'scaleX(-1)' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
                        </svg>
                        <p className="text-text-tertiary text-[10px] sm:text-xs">{t('palm.palmFlat')}</p>
                        <p className="text-text-tertiary text-[10px] sm:text-xs mt-1">{t('palm.allLinesVisible')}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 text-[10px] sm:text-xs flex items-start gap-2">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{t('palm.tipContent')}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Upload Tips */}
          <div className="bg-gradient-to-br from-gold-50 to-peach-50 border border-gold-200/50 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-gold-400 to-gold-600 rounded-lg sm:rounded-xl shadow-soft flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-text-primary font-bold text-base sm:text-lg mb-3 sm:mb-4 font-serif">{t('palm.uploadTipsTitle')}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-white/60 rounded-lg sm:rounded-xl border border-beige-200">
                    <div className="p-1.5 sm:p-2 bg-gold-100 rounded-lg flex-shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gold-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-text-primary font-semibold text-xs sm:text-sm mb-1">{t('palm.goodLighting')}</p>
                      <p className="text-text-secondary text-[10px] sm:text-xs">{t('palm.goodLightingDesc')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-white/60 rounded-lg sm:rounded-xl border border-beige-200">
                    <div className="p-1.5 sm:p-2 bg-sage-100 rounded-lg flex-shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-sage-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-text-primary font-semibold text-xs sm:text-sm mb-1">{t('palm.flatPalm')}</p>
                      <p className="text-text-secondary text-[10px] sm:text-xs">{t('palm.flatPalmDesc')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-white/60 rounded-lg sm:rounded-xl border border-beige-200">
                    <div className="p-1.5 sm:p-2 bg-peach-100 rounded-lg flex-shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-peach-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-text-primary font-semibold text-xs sm:text-sm mb-1">{t('palm.clearLines')}</p>
                      <p className="text-text-secondary text-[10px] sm:text-xs">{t('palm.clearLinesDesc')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-white/60 rounded-lg sm:rounded-xl border border-beige-200">
                    <div className="p-1.5 sm:p-2 bg-gold-100 rounded-lg flex-shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gold-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-text-primary font-semibold text-xs sm:text-sm mb-1">{t('palm.steadyCamera')}</p>
                      <p className="text-text-secondary text-[10px] sm:text-xs">{t('palm.steadyCameraDesc')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Upload Section - MOVED TO BOTTOM */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
            {PALM_TYPES.map(({ value, label, description }) => {
              const image = getImageForType(value)

              return (
                <div
                  key={value}
                  className="border-2 border-dashed border-beige-300 rounded-lg sm:rounded-xl p-4 sm:p-6 bg-ivory-50 hover:border-gold-400 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-text-primary font-semibold text-lg">
                        {label}
                        <span className="text-red-500 ml-1">*</span>
                      </h3>
                      <p className="text-text-secondary text-sm mt-1">{description}</p>
                    </div>
                  </div>

                  {image ? (
                    <div className="relative">
                      <img
                        src={image.preview}
                        alt={label}
                        className="w-full h-64 object-contain rounded-xl mb-3 bg-beige-50 border border-beige-200"
                      />
                      {image.uploading && (
                        <div className="absolute inset-0 bg-white/90 flex items-center justify-center rounded-xl">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500 mx-auto mb-2"></div>
                            <div className="text-text-primary font-semibold">{t('palm.uploading')}</div>
                          </div>
                        </div>
                      )}
                      {image.error && (
                        <div className="text-red-600 text-sm mb-2 p-2 bg-red-50 border border-red-200 rounded-lg">{image.error}</div>
                      )}
                      <button
                        onClick={() => removeImage(image.id, value)}
                        disabled={image.uploading}
                        className="w-full px-3 sm:px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold disabled:opacity-50 transition-colors shadow-soft"
                      >
                        {t('palm.remove')}
                      </button>
                    </div>
                  ) : cameraActive.palmType === value ? (
                    <div className="space-y-3">
                      <div className="relative bg-black rounded-xl overflow-hidden">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-64 object-cover bg-black"
                          style={{ transform: 'scaleX(-1)' }}
                        />
                        {!cameraReady && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                              <p className="text-white text-sm">{t('palm.startingCamera')}</p>
                            </div>
                          </div>
                        )}
                        {cameraReady && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 z-10 pointer-events-none">
                            <p className="text-white text-sm font-medium text-center">{t('palm.positionPalm')}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => capturePhoto(value)}
                          className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg sm:rounded-xl font-semibold transition-colors flex items-center justify-center gap-1.5 sm:gap-2 shadow-soft text-xs sm:text-sm"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {t('palm.capturePhoto')}
                        </button>
                        <button
                          onClick={stopCamera}
                          className="px-3 sm:px-4 py-2 sm:py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg sm:rounded-xl font-semibold transition-colors shadow-soft text-xs sm:text-sm"
                        >
                          {t('palm.cancel')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <label className="cursor-pointer">
                          <input
                            ref={(el) => {
                              if (el) fileInputRefs.current[value] = el
                            }}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={(e) => handleFileSelect(value, e.target.files?.[0] || null)}
                            className="hidden"
                          />
                          <div className="border-2 border-dashed border-beige-300 rounded-lg sm:rounded-xl p-4 sm:p-6 text-center hover:border-gold-400 transition-colors bg-white hover:bg-beige-50">
                            <div className="flex justify-center mb-1.5 sm:mb-2">
                              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gold-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div className="text-text-primary font-semibold text-xs sm:text-sm mb-1">{t('palm.gallery')}</div>
                            <div className="text-text-tertiary text-[10px] sm:text-xs">{t('palm.chooseFile')}</div>
                          </div>
                        </label>
                        <button
                          onClick={() => startCamera(value)}
                          className="border-2 border-dashed border-beige-300 rounded-lg sm:rounded-xl p-4 sm:p-6 text-center hover:border-gold-400 transition-colors bg-white hover:bg-beige-50"
                        >
                          <div className="flex justify-center mb-1.5 sm:mb-2">
                            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gold-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <div className="text-text-primary font-semibold text-xs sm:text-sm mb-1">{t('palm.camera')}</div>
                          <div className="text-text-tertiary text-[10px] sm:text-xs">{t('palm.takePhoto')}</div>
                        </button>
                      </div>
                      <label className="block">
                        <input
                          ref={(el) => {
                            if (el) cameraInputRefs.current[value] = el
                          }}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => handleFileSelect(value, e.target.files?.[0] || null)}
                          className="hidden"
                        />
                        <div className="text-center">
                          <button
                            onClick={() => cameraInputRefs.current[value]?.click()}
                            className="text-gold-600 text-sm hover:text-gold-700 underline"
                          >
                            {t('palm.useMobileCamera')}
                          </button>
                        </div>
                      </label>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Matching Status Display */}
          {matchingInProgress && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mb-6">
              <div className="flex items-center gap-3">
                <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-text-primary font-semibold">{t('palm.matchingPalms')}</span>
              </div>
            </div>
          )}

          {matchingStatus && !matchingInProgress && (
            <div className={`p-5 rounded-xl mb-6 border-2 ${matchingStatus.status === 'matched'
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
              }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {matchingStatus.status === 'matched' ? (
                    <div className="p-2 bg-green-100 rounded-lg">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  ) : (
                    <div className="p-2 bg-red-100 rounded-lg">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <p className="text-text-primary font-bold text-lg">
                      {matchingStatus.status === 'matched' ? t('palm.palmsMatched') : t('palm.palmsNotMatched')}
                    </p>
                    {matchingStatus.confidence > 0 && (
                      <p className="text-text-secondary text-sm mt-1">
                        {t('palm.matchingScore')}: <span className="font-semibold text-text-primary">{(matchingStatus.confidence * 100).toFixed(1)}%</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-text-secondary text-sm mb-3">{matchingStatus.message}</p>
              {matchingStatus.status === 'mismatch' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-3">
                  <p className="text-yellow-700 text-sm">
                    {t('common.pleaseReUpload')}
                  </p>
                </div>
              )}
              <button
                onClick={triggerMatching}
                disabled={matchingInProgress}
                className="w-full md:w-auto px-6 py-2.5 bg-gradient-to-r from-peach-500 to-peach-600 hover:from-peach-600 hover:to-peach-700 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-soft hover:shadow-soft-lg flex items-center gap-2 justify-center"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {t('palm.matchAgain')}
              </button>
            </div>
          )}

          {/* Show matching button if both palms uploaded but no status yet */}
          {!matchingStatus && !matchingInProgress &&
            uploadedImages.some(img => img.palmType === 'right_front' && img.id && img.id.length > 20) &&
            uploadedImages.some(img => img.palmType === 'left_front' && img.id && img.id.length > 20) && (
              <div className="p-5 bg-peach-50 border border-peach-200 rounded-xl mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-peach-100 rounded-lg">
                      <svg className="w-6 h-6 text-peach-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-text-primary font-semibold mb-1">{t('palm.bothPalmsUploaded')}</p>
                      <p className="text-text-secondary text-sm">{t('palm.verifyMatch')}</p>
                    </div>
                  </div>
                  <button
                    onClick={triggerMatching}
                    disabled={matchingInProgress}
                    className="px-6 py-2.5 bg-gradient-to-r from-peach-500 to-peach-600 hover:from-peach-600 hover:to-peach-700 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-soft hover:shadow-soft-lg flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {t('palm.matchPalms')}
                  </button>
                </div>
              </div>
            )}

          {/* Continue Button */}
          <div className="flex justify-center sm:justify-end mt-4 sm:mt-6">
            <button
              onClick={handleContinue}
              disabled={uploading || uploadedImages.some(img => img.uploading) || matchingInProgress}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white rounded-lg sm:rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ease-out shadow-soft hover:shadow-soft-lg hover:shadow-gold-500/30 transform hover:scale-[1.03] active:scale-[0.98] text-sm sm:text-base"
            >
              {matchingInProgress ? t('palm.matchingInProgress') : t('palm.continue')}
            </button>
          </div>
        </div>
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </main>
  )
}
