import { useCallback, useMemo, useRef, useState } from 'react'
import type { ClipboardEvent } from 'react'
import { useParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { fileUpload } from './utils'
import { useToastContext } from '@/app/components/base/toast'
import type { FileSettings, ImageFile, VisionSettings } from '@/types/app'
import { All_ALLOW_FILE_EXTENSIONS, File_ALLOW_FILE_EXTENSIONS, TransferMethod } from '@/types/app'

export const useFiles = () => {
  const params = useParams()
  const { t } = useTranslation()
  const { notify } = useToastContext()
  const [files, setFiles] = useState<ImageFile[]>([])
  const filesRef = useRef<ImageFile[]>([])

  const handleUpload = (imageFile: ImageFile) => {
    const files = filesRef.current
    const index = files.findIndex(file => file._id === imageFile._id)

    if (index > -1) {
      const currentFile = files[index]
      const newFiles = [...files.slice(0, index), { ...currentFile, ...imageFile }, ...files.slice(index + 1)]
      setFiles(newFiles)
      filesRef.current = newFiles
    }
    else {
      const newFiles = [...files, imageFile]
      setFiles(newFiles)
      filesRef.current = newFiles
    }
  }
  const handleRemove = (imageFileId: string) => {
    const files = filesRef.current
    const index = files.findIndex(file => file._id === imageFileId)

    if (index > -1) {
      const currentFile = files[index]
      const newFiles = [...files.slice(0, index), { ...currentFile, deleted: true }, ...files.slice(index + 1)]
      setFiles(newFiles)
      filesRef.current = newFiles
    }
  }
  const handleFileLinkLoadError = (imageFileId: string) => {
    const files = filesRef.current
    const index = files.findIndex(file => file._id === imageFileId)

    if (index > -1) {
      const currentFile = files[index]
      const newFiles = [...files.slice(0, index), { ...currentFile, progress: -1 }, ...files.slice(index + 1)]
      filesRef.current = newFiles
      setFiles(newFiles)
    }
  }
  const handleFileLinkLoadSuccess = (imageFileId: string) => {
    const files = filesRef.current
    const index = files.findIndex(file => file._id === imageFileId)

    if (index > -1) {
      const currentImageFile = files[index]
      const newFiles = [...files.slice(0, index), { ...currentImageFile, progress: 100 }, ...files.slice(index + 1)]
      filesRef.current = newFiles
      setFiles(newFiles)
    }
  }
  const handleReUpload = (imageFileId: string) => {
    const files = filesRef.current
    const index = files.findIndex(file => file._id === imageFileId)

    if (index > -1) {
      const currentImageFile = files[index]
      fileUpload({
        file: currentImageFile.file!,
        onProgressCallback: (progress) => {
          const newFiles = [...files.slice(0, index), { ...currentImageFile, progress }, ...files.slice(index + 1)]
          filesRef.current = newFiles
          setFiles(newFiles)
        },
        onSuccessCallback: (res) => {
          const newFiles = [...files.slice(0, index), { ...currentImageFile, fileId: res.id, progress: 100 }, ...files.slice(index + 1)]
          filesRef.current = newFiles
          setFiles(newFiles)
        },
        onErrorCallback: () => {
          notify({ type: 'error', message: t('common.fileUploader.uploadFromComputerUploadError') })
          const newFiles = [...files.slice(0, index), { ...currentImageFile, progress: -1 }, ...files.slice(index + 1)]
          filesRef.current = newFiles
          setFiles(newFiles)
        },
      }, !!params.token)
    }
  }

  const handleClear = () => {
    setFiles([])
    filesRef.current = []
  }

  const filteredFiles = useMemo(() => {
    return files.filter(file => !file.deleted)
  }, [files])

  return {
    fileFiles: filteredFiles,
    onFileUpload: handleUpload,
    onFileRemove: handleRemove,
    onFileLinkLoadError: handleFileLinkLoadError,
    onFileLinkLoadSuccess: handleFileLinkLoadSuccess,
    onFileReUpload: handleReUpload,
    onFileClear: handleClear,
  }
}

type useLocalUploaderProps = {
  disabled?: boolean
  limit?: number
  onFileUpload: (imageFile: ImageFile) => void
  visionConfig?: VisionSettings
}

export const useLocalFileUploader = ({ limit, disabled = false, onFileUpload, visionConfig }: useLocalUploaderProps) => {
  const { notify } = useToastContext()
  const params = useParams()
  const { t } = useTranslation()

  const handleLocalFileUpload = useCallback((file: File) => {
    if (disabled) {
      // TODO: leave some warnings?
      return
    }
    if (visionConfig?.enabled) {
      if (!All_ALLOW_FILE_EXTENSIONS.includes(file.name.split('.')[1])) {
        notify({ type: 'error', message: t('common.fileUploader.uploadFromComputerTypeLimit', { type: All_ALLOW_FILE_EXTENSIONS }) })
        return
      }
    }
    else {
      if (!File_ALLOW_FILE_EXTENSIONS.includes(file.name.split('.')[1])) {
        notify({ type: 'error', message: t('common.fileUploader.uploadFromComputerTypeLimit', { type: File_ALLOW_FILE_EXTENSIONS }) })
        return
      }
    }

    if (limit && file.size > limit * 1024 * 1024) {
      notify({ type: 'error', message: t('common.fileUploader.uploadFromComputerLimit', { size: limit }) })
      return
    }

    const reader = new FileReader()
    reader.addEventListener(
      'load',
      () => {
        const imageFile = {
          type: TransferMethod.local_file,
          _id: `${Date.now()}`,
          fileId: '',
          file,
          url: reader.result as string,
          base64Url: reader.result as string,
          progress: 0,
        }
        onFileUpload(imageFile)
        fileUpload({
          file: imageFile.file,
          onProgressCallback: (progress) => {
            onFileUpload({ ...imageFile, progress })
          },
          onSuccessCallback: (res) => {
            onFileUpload({ ...imageFile, fileId: res.id, progress: 100 })
          },
          onErrorCallback: () => {
            notify({ type: 'error', message: t('common.fileUploader.uploadFromComputerUploadError') })
            onFileUpload({ ...imageFile, progress: -1 })
          },
        }, !!params.token)
      },
      false,
    )
    reader.addEventListener(
      'error',
      () => {
        notify({ type: 'error', message: t('common.fileUploader.uploadFromComputerReadError') })
      },
      false,
    )
    reader.readAsDataURL(file)
  }, [disabled, limit, notify, t, onFileUpload, params.token])

  return { disabled, handleLocalFileUpload }
}

type useClipboardUploaderProps = {
  fileFiles: ImageFile[]
  fileConfig?: FileSettings
  onFileUpload: (imageFile: ImageFile) => void
  visionConfig?: VisionSettings
}

export const useFileClipboardUploader = ({ fileConfig, onFileUpload, fileFiles, visionConfig }: useClipboardUploaderProps) => {
  const allowLocalUpload = fileConfig?.transfer_methods?.includes(TransferMethod.local_file)
  const disabled = useMemo(() =>
    !fileConfig
    || !fileConfig?.enabled
    || !allowLocalUpload
    || fileFiles.length >= fileConfig.number_limits!,
  [allowLocalUpload, fileFiles.length, fileConfig])
  const limit = useMemo(() => fileConfig ? +fileConfig.image_file_size_limit! : 0, [fileConfig])
  const { handleLocalFileUpload } = useLocalFileUploader({ limit, onFileUpload, disabled, visionConfig })

  const handleClipboardPaste = useCallback((e: ClipboardEvent<HTMLTextAreaElement>) => {
    // reserve native text copy behavior
    const file = e.clipboardData?.files[0]
    // when copyed file, prevent default action
    if (file) {
      e.preventDefault()
      handleLocalFileUpload(file)
    }
  }, [handleLocalFileUpload])

  return {
    onFilePaste: handleClipboardPaste,
  }
}

type useDraggableUploaderProps = {
  fileFiles: ImageFile[]
  fileConfig?: FileSettings
  onFileUpload: (imageFile: ImageFile) => void
  visionConfig?: VisionSettings
}

export const useFileDraggableUploader = <T extends HTMLElement>({ fileFiles, fileConfig, onFileUpload, visionConfig }: useDraggableUploaderProps) => {
  const allowLocalUpload = fileConfig?.transfer_methods?.includes(TransferMethod.local_file)
  const disabled = useMemo(() =>
    !fileConfig
    || !fileConfig?.enabled
    || !allowLocalUpload
    || fileFiles.length >= fileConfig.number_limits!,
  [allowLocalUpload, fileFiles.length, fileConfig])
  const limit = useMemo(() => fileConfig ? +fileConfig.image_file_size_limit! : 0, [fileConfig])
  const { handleLocalFileUpload } = useLocalFileUploader({ disabled, onFileUpload, limit, visionConfig })
  const [isDragActive, setIsDragActive] = useState(false)

  const handleDragEnter = useCallback((e: React.DragEvent<T>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled)
      setIsDragActive(true)
  }, [disabled])

  const handleDragOver = useCallback((e: React.DragEvent<T>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<T>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<T>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    const file = e.dataTransfer.files[0]

    if (!file)
      return

    handleLocalFileUpload(file)
  }, [handleLocalFileUpload])

  return {
    onFileDragEnter: handleDragEnter,
    onFileDragOver: handleDragOver,
    onFileDragLeave: handleDragLeave,
    onFileDrop: handleDrop,
    isFileDragActive: isDragActive,
  }
}
