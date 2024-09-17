import { useState, useRef, KeyboardEvent, useEffect } from 'react'
import { Button, Progress } from "@nextui-org/react"
import { FaTelegramPlane, FaPaperclip, FaSmile, FaMicrophone, FaStop, FaVideo, FaTrash, FaPlay, FaPause } from 'react-icons/fa'
import { uploadFile } from '../../lib/supabaseStorage'
import { Textarea, Popover, PopoverTrigger, PopoverContent } from '@nextui-org/react'
import bytes from 'bytes'
import { callApi } from '@/app/utils/api'

interface MessageInputProps {
  onSendMessage: (content: string, media: MediaFile[]) => void;
  onTyping: () => void;
}

interface MediaFile {
  file: File;
  width?: number;
  height?: number;
  type: string;
  url?: string;
}

const emojis = ['😀', '😂', '😍', '🤔', '😎', '👍', '❤️', '🎉', '🔥', '👀']

const EmojiPicker = ({ onEmojiClick, isOpen, onOpenChange }: { onEmojiClick: (emoji: string) => void, isOpen: boolean, onOpenChange: (open: boolean) => void }) => (
  <Popover placement="top" isOpen={isOpen} onOpenChange={onOpenChange}>
    <PopoverTrigger>
      <Button
        isIconOnly
        color="default"
        aria-label="Emoji"
        className="bg-transparent min-w-8 w-8 h-8 p-0"
      >
        <FaSmile className="text-gray-400" size={20} />
      </Button>
    </PopoverTrigger>
    <PopoverContent>
      <div className="grid grid-cols-5 gap-2 p-2">
        {emojis.map(emoji => (
          <button
            key={emoji}
            className="text-2xl hover:bg-gray-200 rounded p-1"
            onClick={() => onEmojiClick(emoji)}
          >
            {emoji}
          </button>
        ))}
      </div>
    </PopoverContent>
  </Popover>
)

const FileUploadButton = ({ onFileInput }: { onFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <>
      <Button
        isIconOnly
        color="default"
        aria-label="Attach file"
        onClick={triggerFileInput}
        className="bg-transparent min-w-8 w-8 h-8 p-0"
      >
        <FaPaperclip className="text-gray-400" size={20} />
      </Button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileInput}
        className="hidden"
        accept="*/*"
        multiple
      />
    </>
  )
}

const FileList = ({ files, onRemoveFile, isUploading, uploadProgress }: { files: MediaFile[], onRemoveFile: (index: number) => void, isUploading: boolean, uploadProgress: {[key: string]: number} }) => {
  const [isPlaying, setIsPlaying] = useState<{[key: string]: boolean}>({})
  const audioRefs = useRef<{[key: string]: HTMLAudioElement | null}>({})

  const togglePlay = (fileName: string) => {
    const audioElement = audioRefs.current[fileName]
    if (audioElement) {
      if (isPlaying[fileName]) {
        audioElement.pause()
      } else {
        audioElement.play()
      }
      setIsPlaying(prev => ({ ...prev, [fileName]: !prev[fileName] }))
    }
  }

  return (
    <div className="mt-2 p-2 bg-gray-200 rounded">
      {files.map((mediaFile, index) => (
        <div key={index} className="flex items-center justify-between mb-1 flex-wrap">
          <div className="flex-1">
            <div className="max-w-3/4 break-all overflow-hidden text-ellipsis">{mediaFile.file.name}</div>
            <div className="text-xs text-gray-500">
              ({bytes(mediaFile.file.size)})
              {mediaFile.width && mediaFile.height && ` ${mediaFile.width}x${mediaFile.height}`}
            </div>
          </div>
          {mediaFile.type.startsWith('audio/') && (
            <div className="flex items-center mr-2">
              <Button
                isIconOnly
                size="sm"
                color="primary"
                onClick={() => togglePlay(mediaFile.file.name)}
              >
                {isPlaying[mediaFile.file.name] ? <FaPause size={12} /> : <FaPlay size={12} />}
              </Button>
              <audio
                ref={el => audioRefs.current[mediaFile.file.name] = el}
                src={mediaFile.url || URL.createObjectURL(mediaFile.file)}
                onEnded={() => setIsPlaying(prev => ({ ...prev, [mediaFile.file.name]: false }))}
              />
            </div>
          )}
          {isUploading ? <Progress 
            value={uploadProgress[mediaFile.file.name] || 0} 
            className="w-1/3 mx-2"
            size="sm"
            color="primary"
            showValueLabel={true}
            valueLabel={`${(uploadProgress[mediaFile.file.name] || 0).toFixed(0)}%`}
          /> : null}
          <Button
            isIconOnly
            size="sm"
            color="danger"
            onClick={() => onRemoveFile(index)}
          >
            <FaTrash />
          </Button>
        </div>
      ))}
    </div>
  )
}

import { twMerge } from 'tailwind-merge'
const AudioRecorder = ({ setAudioBlob }: { setAudioBlob: (blob: Blob | null) => void }) => {
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.start();

      const audioChunks: BlobPart[] = [];
      mediaRecorderRef.current.addEventListener("dataavailable", event => {
        audioChunks.push(event.data);
      });

      mediaRecorderRef.current.addEventListener("stop", () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
      });

      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  return (
    <Button
      isIconOnly
      color="primary"
      aria-label={isRecording ? "Stop recording" : "Start recording"}
      onClick={isRecording ? stopRecording : startRecording}
      className={twMerge('bg-blue-500 text-white rounded-full', isRecording && 'bg-red-500')}
    >
      {isRecording ? <FaStop size={20} /> : <FaMicrophone size={20} />}
    </Button>
  )
}

const VideoRecorder = ({ setVideoBlob }: { setVideoBlob: (blob: Blob | null) => void }) => {
  const [isVideoRecording, setIsVideoRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startVideoRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 300, height: 300 }, audio: true });
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.start();

      const videoChunks: BlobPart[] = [];
      mediaRecorderRef.current.addEventListener("dataavailable", event => {
        videoChunks.push(event.data);
      });

      mediaRecorderRef.current.addEventListener("stop", () => {
        const videoBlob = new Blob(videoChunks, { type: 'video/webm' });
        setVideoBlob(videoBlob);
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      });

      setIsVideoRecording(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsVideoRecording(false);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  return (
    <>
      <Button
        isIconOnly
        color="primary"
        aria-label={isVideoRecording ? "Stop video recording" : "Start video recording"}
        onClick={isVideoRecording ? stopVideoRecording : startVideoRecording}
        className={twMerge('bg-blue-500 text-white rounded-full', isVideoRecording && 'bg-red-500')}
      >
        {isVideoRecording ? <FaStop size={20} /> : <FaVideo size={20} />}
      </Button>
      {isVideoRecording && (
        <div className="mt-2 p-2 bg-gray-200 rounded">
          <video ref={videoRef} autoPlay muted width="300" height="300" style={{ borderRadius: '50%', objectFit: 'cover' }} />
        </div>
      )}
    </>
  )
}

export default function MessageInput({ onSendMessage, onTyping }: MessageInputProps) {
  const [newMessage, setNewMessage] = useState('')
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({})
  const [isUploading, setIsUploading] = useState(false)
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)

  const handleSendMessage = async () => {
    if (newMessage.trim() === '' && mediaFiles.length === 0) return
    const uploadedMedia = await uploadFiles(mediaFiles)
    onSendMessage(newMessage, uploadedMedia as MediaFile[])
    setNewMessage('')
    setMediaFiles([])
  }

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      const newMediaFiles: MediaFile[] = []
      
      for (const file of newFiles) {
        const mediaFile: MediaFile = { file, type: file.type }
        
        if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
          const dimensions = await getMediaDimensions(file)
          mediaFile.width = dimensions.width
          mediaFile.height = dimensions.height
        }
        
        newMediaFiles.push(mediaFile)
      }
      
      setMediaFiles(prev => [...prev, ...newMediaFiles])
    }
    // Reset the file input value to allow selecting the same file again
    if (e.target) {
      e.target.value = ''
    }
  }

  const getMediaDimensions = (file: File): Promise<{ width: number, height: number }> => {
    return new Promise((resolve) => {
      const element = file.type.startsWith('image/') ? new Image() : document.createElement('video')
      element.onload = element.onloadedmetadata = () => {
        const width = 'naturalWidth' in element ? element.naturalWidth : element.videoWidth
        const height = 'naturalHeight' in element ? element.naturalHeight : element.videoHeight
        URL.revokeObjectURL(element.src)
        resolve({ width, height })
      }
      element.src = URL.createObjectURL(file)
    })
  }

  const handleEmojiClick = (emoji: string) => {
    setNewMessage(prev => prev + emoji)
    setIsEmojiPickerOpen(false)
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)
    onTyping()
  }

  const removeFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async (files: MediaFile[]) => {
    setIsUploading(true)
    let uploadedMedia = [];
    for (const mediaFile of files) {
      try {
        const result = await uploadFile(mediaFile.file, 'media', (progress: number) => {
          setUploadProgress(prev => ({ ...prev, [mediaFile.file.name]: progress }))
        })
        if (result) {
          uploadedMedia.push({
            ...result,
            width: mediaFile.width,
            height: mediaFile.height,
            type: mediaFile.type
          })
        }
      } catch (error) {
        console.error('Error uploading file:', error)
      }
    }
    setIsUploading(false)
    return uploadedMedia
  }

  const handleAudioRecorded = (audioBlob: Blob | null) => {
    if (audioBlob) {
      const audioFile = new File([audioBlob], 'voice-message.webm', { type: 'audio/webm' })
      setMediaFiles(prev => [...prev, { file: audioFile, type: 'audio/webm' }])
    }
  }

  const handleVideoRecorded = (videoBlob: Blob | null) => {
    if (videoBlob) {
      const videoFile = new File([videoBlob], 'video-message.webm', { type: 'video/webm' })
      setMediaFiles(prev => [...prev, { file: videoFile, type: 'video/webm' }])
    }
  }

  return (
    <div className=" ">
     <div className="flex items-center space-x-2 p-2">
        <FileUploadButton onFileInput={handleFileInput} />
        <Textarea
          value={newMessage}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Write a message..."
          className="flex-1 bg-none"
          rows={1}
          minRows={1}
          maxRows={4}
        />
        <EmojiPicker
          onEmojiClick={handleEmojiClick}
          isOpen={isEmojiPickerOpen}
          onOpenChange={(open: boolean) => setIsEmojiPickerOpen(open)}
        />
        {newMessage.trim() === '' && mediaFiles.length === 0 ? (
          <Popover isOpen={isPopoverOpen} onOpenChange={(open) => setIsPopoverOpen(open)}>
            <PopoverTrigger>
              <Button
                isIconOnly
                color="primary"
                aria-label="Record"
                className="bg-blue-500 text-white rounded-full"
              >
                <FaMicrophone size={20} />
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <div className="flex flex-col space-y-2">
                <AudioRecorder setAudioBlob={handleAudioRecorded} />
                <VideoRecorder setVideoBlob={handleVideoRecorded} />
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <Button
            isIconOnly
            color="primary"
            isDisabled={isUploading}
            aria-label="Send message"
            onClick={() => handleSendMessage()}
            className="bg-blue-500 text-white rounded-full"
          >
            <FaTelegramPlane size={20} />
          </Button>
        )}
      </div>
      {mediaFiles.length > 0 && (
        <FileList
          files={mediaFiles}
          uploadProgress={uploadProgress}
          isUploading={isUploading}
          onRemoveFile={removeFile}
        />
      )}
    </div>
  )
}