'use client'
import type { FC } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  RiCloseLine,
  RiLoader2Line,
} from '@remixicon/react'
import { getFileName, getFileSize, getFileType } from '../chat/chat/utils'
import s from './index.module.css'
import cn from '@/utils/classnames'
import { RefreshCcw01 } from '@/app/components/base/icons/src/vender/line/arrows'
import { AlertTriangle } from '@/app/components/base/icons/src/vender/solid/alertsAndFeedback'
import TooltipPlus from '@/app/components/base/tooltip-plus'
import type { ImageFile } from '@/types/app'
import { IMAGE_ALLOW_FILE_EXTENSIONS, TransferMethod } from '@/types/app'
import FilePreview from '@/app/components/base/file-uploader/file-preview'

type FileListProps = {
  list: ImageFile[]
  readonly?: boolean
  onRemove?: (imageFileId: string) => void
  onReUpload?: (imageFileId: string) => void
  onFileLinkLoadSuccess?: (imageFileId: string) => void
  onFileLinkLoadError?: (imageFileId: string) => void
}

const FileList: FC<FileListProps> = ({
  list,
  readonly,
  onRemove,
  onReUpload,
  onFileLinkLoadSuccess,
  onFileLinkLoadError,
}) => {
  const { t } = useTranslation()
  const [filePreviewUrl, setFilePreviewUrl] = useState('')

  const handleFileLinkLoadSuccess = (item: ImageFile) => {
    if (
      item.type === TransferMethod.remote_url
      && onFileLinkLoadSuccess
      && item.progress !== -1
    )
      onFileLinkLoadSuccess(item._id)
  }
  const handleFileLinkLoadError = (item: ImageFile) => {
    if (item.type === TransferMethod.remote_url && onFileLinkLoadError)
      onFileLinkLoadError(item._id)
  }

  const isImageType = (currentFile: File) => {
    if (!currentFile)
      return ''
    const arr = currentFile.name.split('.')

    return IMAGE_ALLOW_FILE_EXTENSIONS.includes(arr[arr.length - 1])
  }

  // 保持一致
  function getIcon(file: ImageFile) {
    return file.type === TransferMethod.remote_url ? file.url : file.base64Url
  }
  return (
    <div className="flex w-full flex-wrap">
      {list.map(item => (
        <div
          key={item._id}
          className="w-38 group relative mr-1 border-[0.5px] border-black/5 rounded-lg"
          style={{ backgroundColor: '#f5f5f5', borderRadius: '4px' }}
        >
          {item.type === TransferMethod.local_file && item.progress !== 100 && (
            <>
              <div
                className="absolute inset-0 flex items-center justify-center z-[1] bg-black/30"
                style={{ left: item.progress > -1 ? `${item.progress}%` : 0 }}
              >
                {item.progress === -1 && (
                  <RefreshCcw01
                    className="w-5 h-5 text-white"
                    onClick={() => onReUpload && onReUpload(item._id)}
                  />
                )}
              </div>
              {item.progress > -1 && (
                <span className="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] text-sm text-white mix-blend-lighten z-[1]">
                  {item.progress}%
                </span>
              )}
            </>
          )}
          {item.type === TransferMethod.remote_url && item.progress !== 100 && (
            <div
              className={`
                  absolute inset-0 flex items-center justify-center rounded-lg z-[1] border
                  ${item.progress === -1
              ? 'bg-[#FEF0C7] border-[#DC6803]'
              : 'bg-black/[0.16] border-transparent'
            }
                `}
            >
              {item.progress > -1 && (
                <RiLoader2Line className="animate-spin w-5 h-5 text-white" />
              )}
              {item.progress === -1 && (
                <TooltipPlus
                  popupContent={t('common.imageUploader.pasteImageLinkInvalid')}
                >
                  <AlertTriangle className="w-4 h-4 text-[#DC6803]" />
                </TooltipPlus>
              )}
            </div>
          )}
          <div
            className={`${s.fileInfo}  h-[40px] p-[6px] rounded-lg  cursor-pointer border-[0.5px] border-black/5 bg-[var(--floating_stroke_grey_1,#f5f5f5)`}
            onLoad={() => handleFileLinkLoadSuccess(item)}
            onError={() => handleFileLinkLoadError(item)}
          >

            {/* 对图片的单独处理 */}
            {/* isImageType 返回true,直接将图片放到这里，如果为false 使用下面的fileIcon */}
            {isImageType(item.file)
              ? (
                <img
                  className={s.fileImage}
                  alt={item.file?.name}
                  onLoad={() => handleFileLinkLoadSuccess(item)}
                  onError={() => handleFileLinkLoadError(item)}
                  src={
                    getIcon(item)
                  }
                  onClick={() =>
                    item.progress === 100
                  && setFilePreviewUrl(
                    getIcon(item) as string,
                  )
                  }
                />
              )
              : (
                <div className={cn(s.fileIcon, s[getFileType(item.file)])} />
              )}

            {/* <div className={cn(s.fileIcon, s[getFileType(item.file)])} /> */}
            <div className='flex flex-col'>
              <div className='w-full text-left text-[var(--txt_icon_black_1,#1a2029)] text-xs leading-5' >{getFileName(item.file, 15)}</div>
              <div className='flex center'>
                <div className={cn(s.type, 'w-auto mr-4 text-left text-[var(--txt_icon_black_1,#1a2029)] text-xs leading-5')}>{getFileType(item.file).toUpperCase()}</div>
                <div className={cn(s.size, 'w-auto text-left text-[var(--txt_icon_black_1,#1a2029)] text-xs leading-5')}>{getFileSize(item.file.size)}</div>
              </div>
            </div>
          </div>

          {!readonly && (
            <button
              type="button"
              className={cn(
                'absolute z-10 -top-[9px] -right-[9px] items-center justify-center w-[18px] h-[18px]',
                'bg-white hover:bg-gray-50 border-[0.5px] border-black/2 rounded-2xl shadow-lg',
                item.progress === -1 ? 'flex' : 'hidden group-hover:flex',
              )}
              onClick={() => onRemove && onRemove(item._id)}
            >
              <RiCloseLine className="w-3 h-3 text-gray-500" />
            </button>
          )}
        </div>
      ))}
      {filePreviewUrl && (
        <FilePreview
          url={filePreviewUrl}
          onCancel={() => setFilePreviewUrl('')}
        />
      )}
    </div>
  )
}

export default FileList
