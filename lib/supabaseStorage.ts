import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface UploadResult {
  url: string;
  type: string;
  name: string;
  size?: number;
}

export async function uploadFile(
  file: File,
  bucketName: string,
  onProgress: (progress: number) => void
): Promise<UploadResult | null> {
  const fileName = `${Date.now()}`
  const { data, error } = await supabase.storage
    .from(bucketName)
    .createSignedUploadUrl(fileName)

  if (error) {
    console.error('Error creating signed URL:', error)
    return null
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', data.signedUrl)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100
        onProgress(percentComplete)
      }
    }

    xhr.onload = async function() {
      if (xhr.status === 200) {
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(fileName)

        resolve({
          url: urlData.publicUrl,
          type: file.type,
          name: file.name,
          size: file.size
        })
      } else {
        reject(new Error('Upload failed'))
      }
    }

    xhr.onerror = () => {
      reject(new Error('XHR error'))
    }

    xhr.send(file)
  })
}