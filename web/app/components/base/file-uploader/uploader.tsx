import type { ChangeEvent, FC } from 'react'
import { useState } from 'react'
import { useLocalFileUploader } from './hooks'
import type { ImageFile, VisionSettings } from '@/types/app'
// import { ALLOW_FILE_EXTENSIONS } from '@/types/app'
import {
  All_ALLOW_FILE_EXTENSIONS,
  File_ALLOW_FILE_EXTENSIONS,
} from '@/types/app'

type UploaderProps = {
  children: (hovering: boolean) => JSX.Element
  onFileUpload: (imageFile: ImageFile) => void
  closePopover?: () => void
  limit?: number
  disabled?: boolean
  isImageEnabled?: boolean
  visionConfig?: VisionSettings
}

const Uploader: FC<UploaderProps> = ({
  children,
  onFileUpload,
  closePopover,
  limit,
  disabled,
  isImageEnabled,
  visionConfig,
}) => {
  const [hovering, setHovering] = useState(false)
  const { handleLocalFileUpload } = useLocalFileUploader({
    limit,
    onFileUpload,
    disabled,
    visionConfig,
  })

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (!file)
      return

    handleLocalFileUpload(file)
    closePopover?.()
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {children(hovering)}
      <input
        className="absolute block inset-0 opacity-0 text-[0] w-full disabled:cursor-not-allowed cursor-pointer"
        onClick={e => ((e.target as HTMLInputElement).value = '')}
        type="file"
        accept={
          isImageEnabled
            ? All_ALLOW_FILE_EXTENSIONS.map(ext => `.${ext}`).join(',')
            : File_ALLOW_FILE_EXTENSIONS.map(ext => `.${ext}`).join(',')
        }
        onChange={handleChange}
        disabled={disabled}
      />
    </div>
  )
}

export default Uploader