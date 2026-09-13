/**
 * VideoVerificationService
 * 
 * Clean WebRTC abstraction for Live Skill Verification & Screen Share screenings.
 * Connects directly to browser mediaDevices APIs when available and provides
 * safe fallbacks for environments without camera/mic permissions.
 */

export interface MediaDeviceStatus {
  hasCamera: boolean
  hasMic: boolean
  isScreenShareSupported: boolean
  cameraError?: string | null
  screenShareError?: string | null
}

export class VideoVerificationService {
  /**
   * Check browser capability for WebRTC video and screen share
   */
  static isSupported(): boolean {
    return typeof window !== 'undefined' && !!navigator?.mediaDevices?.getUserMedia
  }

  /**
   * Request and mount local webcam video stream
   */
  static async startLocalCamera(videoElement?: HTMLVideoElement | null): Promise<MediaStream | null> {
    if (!this.isSupported()) {
      throw new Error('WebRTC camera is not supported in this browser environment.')
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      })

      if (videoElement) {
        videoElement.srcObject = stream
        videoElement.play().catch(e => console.warn('Auto-play notice:', e))
      }

      return stream
    } catch (err: any) {
      console.warn('Camera access notice:', err?.message || err)
      throw new Error(err?.message || 'Unable to access camera. Please check browser permissions.')
    }
  }

  /**
   * Request and mount screen sharing stream
   */
  static async startScreenShare(videoElement?: HTMLVideoElement | null): Promise<MediaStream | null> {
    if (typeof window === 'undefined' || !navigator?.mediaDevices?.getDisplayMedia) {
      throw new Error('Screen sharing is not supported in this browser.')
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'monitor' },
        audio: false,
      })

      if (videoElement) {
        videoElement.srcObject = stream
        videoElement.play().catch(e => console.warn('Screen share display notice:', e))
      }

      return stream
    } catch (err: any) {
      console.warn('Screen share notice:', err?.message || err)
      throw new Error(err?.message || 'Screen sharing was cancelled or not permitted.')
    }
  }

  /**
   * Toggle audio track enabled/disabled
   */
  static toggleAudio(stream: MediaStream | null, enabled: boolean): boolean {
    if (!stream) return false
    const audioTracks = stream.getAudioTracks()
    audioTracks.forEach(t => { t.enabled = enabled })
    return enabled
  }

  /**
   * Toggle video track enabled/disabled
   */
  static toggleVideo(stream: MediaStream | null, enabled: boolean): boolean {
    if (!stream) return false
    const videoTracks = stream.getVideoTracks()
    videoTracks.forEach(t => { t.enabled = enabled })
    return enabled
  }

  /**
   * Safely stop all tracks in a MediaStream
   */
  static stopStream(stream: MediaStream | null): void {
    if (!stream) return
    try {
      stream.getTracks().forEach(track => {
        try {
          track.stop()
        } catch {}
      })
    } catch {}
  }
}
