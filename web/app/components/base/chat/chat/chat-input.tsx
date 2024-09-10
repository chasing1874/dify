import type { FC } from 'react'
import { memo, useRef, useState } from 'react'
import { useContext } from 'use-context-selector'
import Recorder from 'js-audio-recorder'
import { useTranslation } from 'react-i18next'
import Textarea from 'rc-textarea'
import type { EnableType, FileConfig, OnSend, VisionConfig } from '../types'
import { TransferMethod } from '../types'
import { useChatWithHistoryContext } from '../chat-with-history/context'
import type { Theme } from '../embedded-chatbot/theme/theme-context'
import { CssTransform } from '../embedded-chatbot/theme/utils'
import { getFileName, getFileSize, getFileType } from './utils'
import Tooltip from '@/app/components/base/tooltip'
import { ToastContext } from '@/app/components/base/toast'
import useBreakpoints, { MediaType } from '@/hooks/use-breakpoints'
import VoiceInput from '@/app/components/base/voice-input'
import { Microphone01 } from '@/app/components/base/icons/src/vender/line/mediaAndDevices'
import { Microphone01 as Microphone01Solid } from '@/app/components/base/icons/src/vender/solid/mediaAndDevices'
import { XCircle } from '@/app/components/base/icons/src/vender/solid/general'
import { Send03 } from '@/app/components/base/icons/src/vender/solid/communication'
import ChatImageUploader from '@/app/components/base/image-uploader/chat-image-uploader'
import ChatFileUploader from '@/app/components/base/file-uploader/chat-file-uploader'
import ImageList from '@/app/components/base/image-uploader/image-list'
import FileList from '@/app/components/base/file-uploader/file-list'

import {
  useClipboardUploader,
  useDraggableUploader,
  useImageFiles,
} from '@/app/components/base/image-uploader/hooks'
import cn from '@/utils/classnames'

import {
  useFileClipboardUploader,
  useFileDraggableUploader,
  useFiles,
} from '@/app/components/base/file-uploader/hooks'

type ChatInputProps = {
  visionConfig?: VisionConfig
  fileConfig?: FileConfig
  speechToTextConfig?: EnableType
  onSend?: OnSend
  theme?: Theme | null
  noSpacing?: boolean
}
const ChatInput: FC<ChatInputProps> = ({
  visionConfig,
  fileConfig,
  speechToTextConfig,
  onSend,
  theme,
  noSpacing,
}) => {
  const { appData } = useChatWithHistoryContext()
  const { t } = useTranslation()
  const { notify } = useContext(ToastContext)
  const [voiceInputShow, setVoiceInputShow] = useState(false)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  const {
    imageFiles,
    onUpload,
    onRemove,
    onReUpload,
    onImageLinkLoadError,
    onImageLinkLoadSuccess,
    onClear,
  } = useImageFiles()
  const { onPaste } = useClipboardUploader({ onUpload, visionConfig, imageFiles })
  const { onDragEnter, onDragLeave, onDragOver, onDrop, isDragActive }
    = useDraggableUploader<HTMLTextAreaElement>({
      onUpload,
      imageFiles,
      visionConfig,
    })

  // 文件钩子函数
  const {
    fileFiles,
    onFileUpload,
    onFileRemove,
    onFileReUpload,
    onFileLinkLoadError,
    onFileLinkLoadSuccess,
    onFileClear,
  } = useFiles()

  const { onFilePaste } = useFileClipboardUploader({ onFileUpload, fileConfig, fileFiles, visionConfig })

  const { onFileDragEnter, onFileDragLeave, onFileDragOver, onFileDrop, isFileDragActive }
  = useFileDraggableUploader<HTMLTextAreaElement>({
    onFileUpload,
    fileFiles,
    fileConfig,
    visionConfig,
  })

  const isUseInputMethod = useRef(false)
  const [query, setQuery] = useState('')
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setQuery(value)
  }

  const SHEET_FILE_TYPES = ['xlsx']
  const getFileTwoType = (name: string | undefined) => {
    if (!name)
      return 'image'
    const type = name.substring(name.lastIndexOf('.') + 1)
    if (SHEET_FILE_TYPES.includes(type))
      return 'sheet'
    return 'image'
  }
  const files = imageFiles.concat(fileFiles)
  const imageFilesMap = imageFiles.map(fileItem => ({
    progress: fileItem.progress,
    type: getFileTwoType(fileItem.file?.name),
    transfer_method: fileItem.type,
    url: fileItem.url,
    size: getFileSize(fileItem.file, fileItem.type),
    upload_file_id: fileItem.fileId,
    _id: fileItem._id,
    name: getFileName(fileItem.file, fileItem.type),
    fileType: getFileType(fileItem.file, fileItem.type, fileItem.url),
  }))

  const fileFilesMap = fileFiles.map(fileItem => ({
    progress: fileItem.progress,
    type: getFileTwoType(fileItem.file?.name),
    transfer_method: fileItem.type,
    url: fileItem.url,
    size: getFileSize(fileItem.file, fileItem.type),
    upload_file_id: fileItem.fileId,
    name: getFileName(fileItem.file, fileItem.type),
    fileType: getFileType(fileItem.file, fileItem.type, fileItem.url),
    _id: fileItem._id,
  }))

  const filesMap = imageFilesMap.concat(fileFilesMap)

  const handleSend = () => {
    if (onSend) {
      if (
        files.find(
          item => item.type === TransferMethod.local_file && !item.fileId,
        )
      ) {
        notify({
          type: 'info',
          message: t('appDebug.errorMessage.waitForImgUpload'),
        })
        return
      }
      if (!query || !query.trim()) {
        notify({
          type: 'info',
          message: t('appAnnotation.errorMessage.queryRequired'),
        })
        return
      }

      onSend(
        query,
        filesMap.filter(file => file.progress !== -1),
      )
      setQuery('')
      // image clear
      onClear()
      // file clear
      onFileClear()
    }
  }

  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      // prevent send message when using input method enter
      if (!e.shiftKey && !isUseInputMethod.current)
        handleSend()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    isUseInputMethod.current = e.nativeEvent.isComposing
    if (e.key === 'Enter' && !e.shiftKey) {
      setQuery(query.replace(/\n$/, ''))
      e.preventDefault()
    }
  }

  const logError = (message: string) => {
    notify({ type: 'error', message })
  }
  const handleVoiceInputShow = () => {
    (Recorder as any).getPermission().then(
      () => {
        setVoiceInputShow(true)
      },
      () => {
        logError(t('common.voiceInput.notAllow'))
      },
    )
  }

  const [isActiveIconFocused, setActiveIconFocused] = useState(false)

  const media = useBreakpoints()
  const isMobile = media === MediaType.mobile
  const sendIconThemeStyle = theme
    ? {
      color:
          // eslint-disable-next-line no-mixed-operators
          isActiveIconFocused || query || query.trim() !== ''
            // eslint-disable-next-line no-mixed-operators
            ? theme.primaryColor
            : '#d1d5db',
    }
    : {}
  const sendBtn = (
    <div
      className="group flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[#EBF5FF] cursor-pointer"
      onMouseEnter={() => setActiveIconFocused(true)}
      onMouseLeave={() => setActiveIconFocused(false)}
      onClick={handleSend}
      style={
        isActiveIconFocused
          ? CssTransform(theme?.chatBubbleColorStyle ?? '')
          : {}
      }
    >
      <Send03
        style={sendIconThemeStyle}
        className={`
          w-5 h-5 text-gray-300 group-hover:text-primary-600
          ${!!query.trim() && 'text-primary-600'}
        `}
      />
    </div>
  )

  return (
    <>
      <div className={cn('relative', !noSpacing && 'px-8')}>
        <div
          className={`
            p-[5.5px] max-h-[150px] bg-white border-[1.5px] border-gray-200 rounded-xl overflow-y-auto
            ${(isDragActive || isFileDragActive) && 'border-primary-600'} mb-2
          `}
        >
          {visionConfig?.enabled && !fileConfig?.enabled && (
            <>
              <div className="absolute bottom-2 left-2 flex items-center">
                <ChatImageUploader
                  settings={visionConfig}
                  onUpload={onUpload}
                  disabled={imageFilesMap.length >= visionConfig.number_limits}
                />
                <div className="mx-1 w-[1px] h-4 bg-black/5" />
              </div>
              <div className="pl-[52px]">
                <ImageList
                  list={imageFilesMap}
                  onRemove={onRemove}
                  onReUpload={onReUpload}
                  onImageLinkLoadSuccess={onImageLinkLoadSuccess}
                  onImageLinkLoadError={onImageLinkLoadError}
                />
              </div>
            </>
          )}

          {fileConfig?.enabled && (
            <>
              <div className="absolute bottom-2 left-2 flex items-center">
                <ChatFileUploader
                  settings={fileConfig}
                  onFileUpload={onFileUpload}
                  disabled={fileFilesMap.length >= fileConfig.number_limits}
                  isImageEnabled={visionConfig?.enabled}
                  visionConfig={visionConfig}
                />
                <div className="mx-1 w-[1px] h-4 bg-black/5" />
              </div>
              <div className="pl-[52px]">
                <FileList
                  list={fileFilesMap}
                  onRemove={onFileRemove}
                  onReUpload={onFileReUpload}
                  onFileLinkLoadSuccess={onFileLinkLoadSuccess}
                  onFileLinkLoadError={onFileLinkLoadError}
                />
              </div>
            </>
          )}

          {/* file and image upload process */}
          { visionConfig?.enabled && !fileConfig?.enabled && (
            <>
              <Textarea
                ref={textAreaRef}
                className={`
              block w-full px-2 pr-[118px] py-[7px] leading-5 max-h-none text-sm text-gray-700 outline-none appearance-none resize-none
              ${(visionConfig?.enabled || fileConfig?.enabled) && 'pl-12'}
            `}
                value={query}
                onChange={handleContentChange}
                onKeyUp={handleKeyUp}
                onKeyDown={handleKeyDown}
                onPaste={onPaste}
                onDragEnter={onDragEnter}
                onDragLeave={onDragLeave}
                onDragOver={onDragOver}
                onDrop={onDrop}
                autoSize
              />
            </>
          ) }

          { fileConfig?.enabled && (
            <>
              <Textarea
                ref={textAreaRef}
                className={`
              block w-full px-2 pr-[118px] py-[7px] leading-5 max-h-none text-sm text-gray-700 outline-none appearance-none resize-none
              ${(visionConfig?.enabled || fileConfig?.enabled) && 'pl-12'}
            `}
                value={query}
                onChange={handleContentChange}
                onKeyUp={handleKeyUp}
                onKeyDown={handleKeyDown}
                onPaste={onFilePaste}
                onDragEnter={onFileDragEnter}
                onDragLeave={onFileDragLeave}
                onDragOver={onFileDragOver}
                onDrop={onFileDrop}
                autoSize
              />
            </>
          ) }

          { !fileConfig?.enabled && !visionConfig?.enabled && (
            <>
              <Textarea
                ref={textAreaRef}
                className={`
              block w-full px-2 pr-[118px] py-[7px] leading-5 max-h-none text-sm text-gray-700 outline-none appearance-none resize-none
              ${(visionConfig?.enabled || fileConfig?.enabled) && 'pl-12'}
            `}
                value={query}
                onChange={handleContentChange}
                onKeyUp={handleKeyUp}
                onKeyDown={handleKeyDown}
                autoSize
              />
            </>
          ) }

          <div className={cn('absolute bottom-[7px] flex items-center h-8', noSpacing ? 'right-2' : 'right-10')}>
            <div className="flex items-center px-1 h-5 rounded-md bg-gray-100 text-xs font-medium text-gray-500">
              {query.trim().length}
            </div>
            {query
              ? (
                <div
                  className="flex justify-center items-center ml-2 w-8 h-8 cursor-pointer hover:bg-gray-100 rounded-lg"
                  onClick={() => setQuery('')}
                >
                  <XCircle className="w-4 h-4 text-[#98A2B3]" />
                </div>
              )
              : speechToTextConfig?.enabled
                ? (
                  <div
                    className="group flex justify-center items-center ml-2 w-8 h-8 hover:bg-primary-50 rounded-lg cursor-pointer"
                    onClick={handleVoiceInputShow}
                  >
                    <Microphone01 className="block w-4 h-4 text-gray-500 group-hover:hidden" />
                    <Microphone01Solid className="hidden w-4 h-4 text-primary-600 group-hover:block" />
                  </div>
                )
                : null}
            <div className="mx-2 w-[1px] h-4 bg-black opacity-5" />
            {isMobile
              ? (
                sendBtn
              )
              : (
                <Tooltip
                  popupContent={
                    <div>
                      <div>{t('common.operation.send')} Enter</div>
                      <div>{t('common.operation.lineBreak')} Shift Enter</div>
                    </div>
                  }
                >
                  {sendBtn}
                </Tooltip>
              )}
          </div>
          {
            voiceInputShow && (
              <VoiceInput
                onCancel={() => setVoiceInputShow(false)}
                onConverted={(text) => {
                  setQuery(text)
                  textAreaRef.current?.focus()
                }}
              />
            )
          }
        </div>
      </div>
      {appData?.site?.custom_disclaimer && (
        <div className="text-xs text-gray-500 mt-1 text-center">
          {appData.site.custom_disclaimer}
        </div>
      )}
    </>
  )
}

export default memo(ChatInput)
