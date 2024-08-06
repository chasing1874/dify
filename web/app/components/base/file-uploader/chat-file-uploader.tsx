import type { FC } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FilePlus01 } from '../icons/src/vender/line/files'
import Uploader from './uploader'
import FileLinkInput from './file-link-input'
import cn from '@/utils/classnames'
import { TransferMethod } from '@/types/app'
import {
  PortalToFollowElem,
  PortalToFollowElemContent,
  PortalToFollowElemTrigger,
} from '@/app/components/base/portal-to-follow-elem'
import { Upload03 } from '@/app/components/base/icons/src/vender/line/general'
import type { FileSettings, ImageFile, VisionSettings } from '@/types/app'

type UploadOnlyFromLocalProps = {
  onFileUpload: (imageFile: ImageFile) => void
  disabled?: boolean
  limit?: number
  isImageEnabled?: boolean
  visionConfig?: VisionSettings
}
const UploadOnlyFromLocal: FC<UploadOnlyFromLocalProps> = ({
  onFileUpload,
  disabled,
  limit,
  isImageEnabled,
  visionConfig,
}) => {
  return (
    <Uploader onFileUpload={onFileUpload} disabled={disabled} limit={limit} isImageEnabled={isImageEnabled} visionConfig={visionConfig}>
      {hovering => (
        <div
          className={`
            relative flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer
            ${hovering && 'bg-gray-100'}
          `}
        >
          <FilePlus01 className="w-4 h-4 text-gray-500" />
        </div>
      )}
    </Uploader>
  )
}

type UploaderButtonProps = {
  methods: FileSettings['transfer_methods']
  onFileUpload: (imageFile: ImageFile) => void
  disabled?: boolean
  limit?: number
  visionConfig?: VisionSettings
}
const UploaderButton: FC<UploaderButtonProps> = ({
  methods,
  onFileUpload,
  disabled,
  limit,
  visionConfig,
}) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  const hasUploadFromLocal = methods.find(
    method => method === TransferMethod.local_file,
  )

  const handleUpload = (imageFile: ImageFile) => {
    onFileUpload(imageFile)
  }

  const closePopover = () => setOpen(false)

  const handleToggle = () => {
    if (disabled)
      return

    setOpen(v => !v)
  }

  return (
    <PortalToFollowElem
      open={open}
      onOpenChange={setOpen}
      placement="top-start"
    >
      <PortalToFollowElemTrigger onClick={handleToggle}>
        <button
          type="button"
          disabled={disabled}
          className="relative flex items-center justify-center w-8 h-8 enabled:hover:bg-gray-100 rounded-lg disabled:cursor-not-allowed"
        >
          {/* <FilePlus01 className="w-4 h-4 text-gray-500" /> */}
          <FilePlus01 className="w-4 h-4 text-gray-500" />
        </button>
      </PortalToFollowElemTrigger>
      <PortalToFollowElemContent className="z-50">
        <div className="p-2 w-[260px] bg-white rounded-lg border-[0.5px] border-gray-200 shadow-lg">
          <FileLinkInput onFileUpload={handleUpload} disabled={disabled} />
          {hasUploadFromLocal && (
            <>
              <div className="flex items-center mt-2 px-2 text-xs font-medium text-gray-400">
                <div className="mr-3 w-[93px] h-[1px] bg-gradient-to-l from-[#F3F4F6]" />
                OR
                <div className="ml-3 w-[93px] h-[1px] bg-gradient-to-r from-[#F3F4F6]" />
              </div>
              <Uploader
                onFileUpload={handleUpload}
                limit={limit}
                closePopover={closePopover}
                visionConfig={visionConfig}
              >
                {hovering => (
                  <div
                    className={cn(
                      'flex items-center justify-center h-8 text-[13px] font-medium text-[#155EEF] rounded-lg cursor-pointer',
                      hovering && 'bg-primary-50',
                    )}
                  >
                    <Upload03 className="mr-1 w-4 h-4" />
                    {t('common.fileUploader.uploadFromComputer')}
                  </div>
                )}
              </Uploader>
            </>
          )}
        </div>
      </PortalToFollowElemContent>
    </PortalToFollowElem>
  )
}

type ChatFileUploaderProps = {
  settings: FileSettings
  onFileUpload: (imageFile: ImageFile) => void
  disabled?: boolean
  isImageEnabled?: boolean
  visionConfig?: VisionSettings
}
const ChatFileUploader: FC<ChatFileUploaderProps> = ({
  settings,
  onFileUpload,
  disabled,
  isImageEnabled,
  visionConfig,
}) => {
  const onlyUploadLocal
    = settings.transfer_methods.length === 1
    && settings.transfer_methods[0] === TransferMethod.local_file

  if (onlyUploadLocal) {
    return (
      <UploadOnlyFromLocal
        onFileUpload={onFileUpload}
        disabled={disabled}
        limit={+settings.image_file_size_limit!}
        isImageEnabled={isImageEnabled}
        visionConfig={visionConfig}
      />
    )
  }

  return (
    <UploaderButton
      methods={settings.transfer_methods}
      onFileUpload={onFileUpload}
      disabled={disabled}
      limit={+settings.image_file_size_limit!}
      visionConfig={visionConfig}
    />
  )
}

export default ChatFileUploader
