import type { FC } from 'react'
import {
  Fragment,
  useEffect,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import Uploader from './uploader'
import FileLinkInput from './file-link-input'
import FileList from './file-list'
import { useFiles } from './hooks'
import { FilePlus01 } from '@/app/components/base/icons/src/vender/line/files'
import { Link03 } from '@/app/components/base/icons/src/vender/line/general'
import {
  PortalToFollowElem,
  PortalToFollowElemContent,
  PortalToFollowElemTrigger,
} from '@/app/components/base/portal-to-follow-elem'
import type { FileSettings, ImageFile } from '@/types/app'
import { TransferMethod } from '@/types/app'

type PasteFileLinkButtonProps = {
  onFileUpload: (imageFile: ImageFile) => void
  disabled?: boolean
}
const PasteFileLinkButton: FC<PasteFileLinkButtonProps> = ({
  onFileUpload,
  disabled,
}) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  const handleUpload = (imageFile: ImageFile) => {
    setOpen(false)
    onFileUpload(imageFile)
  }

  const handleToggle = () => {
    if (disabled)
      return

    setOpen(v => !v)
  }

  return (
    <PortalToFollowElem
      open={open}
      onOpenChange={setOpen}
      placement='top-start'
    >
      <PortalToFollowElemTrigger onClick={handleToggle}>
        <div className={`
          relative flex items-center justify-center px-3 h-8 bg-gray-100 hover:bg-gray-200 text-xs text-gray-500 rounded-lg
          ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
        `}>
          <Link03 className='mr-2 w-4 h-4' />
          {t('common.fileUploader.pasteFileLink')}
        </div>
      </PortalToFollowElemTrigger>
      <PortalToFollowElemContent className='z-10'>
        <div className='p-2 w-[320px] bg-white border-[0.5px] border-gray-200 rounded-lg shadow-lg'>
          <FileLinkInput onFileUpload={handleUpload} />
        </div>
      </PortalToFollowElemContent>
    </PortalToFollowElem>
  )
}

type TextGenerationImageUploaderProps = {
  settings: FileSettings
  onFilesChange: (files: ImageFile[]) => void
}
const TextGenerationImageUploader: FC<TextGenerationImageUploaderProps> = ({
  settings,
  onFilesChange,
}) => {
  const { t } = useTranslation()

  const {
    fileFiles,
    onFileUpload,
    onFileRemove,
    onFileLinkLoadError,
    onFileLinkLoadSuccess,
    onFileReUpload,
  } = useFiles()

  useEffect(() => {
    onFilesChange(fileFiles)
  }, [fileFiles])

  const localUpload = (
    <Uploader
      onFileUpload={onFileUpload}
      disabled={fileFiles.length >= settings.number_limits}
      limit={+settings.image_file_size_limit!}
    >
      {
        hovering => (
          <div className={`
            flex items-center justify-center px-3 h-8 bg-gray-100
            text-xs text-gray-500 rounded-lg cursor-pointer
            ${hovering && 'bg-gray-200'}
          `}>
            <FilePlus01 className='mr-2 w-4 h-4' />
            {t('common.fileUploader.uploadFromComputer')}
          </div>
        )
      }
    </Uploader>
  )

  const urlUpload = (
    <PasteFileLinkButton
      onFileUpload={onFileUpload}
      disabled={fileFiles.length >= settings.number_limits}
    />
  )

  return (
    <div>
      <div className='mb-1'>
        <FileList
          list={fileFiles}
          onRemove={onFileRemove}
          onReUpload={onFileReUpload}
          onFileLinkLoadError={onFileLinkLoadError}
          onFileLinkLoadSuccess={onFileLinkLoadSuccess}
        />
      </div>
      <div className={`grid gap-1 ${settings.transfer_methods.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {
          settings.transfer_methods.map((method) => {
            if (method === TransferMethod.local_file)
              return <Fragment key={TransferMethod.local_file}>{localUpload}</Fragment>

            if (method === TransferMethod.remote_url)
              return <Fragment key={TransferMethod.remote_url}>{urlUpload}</Fragment>

            return null
          })
        }
      </div>
    </div>
  )
}

export default TextGenerationImageUploader
