'use client'
import type { FC } from 'react'
import React, { useState } from 'react'
import s from './style.module.css'
import { IMAGE_ALLOW_FILE_EXTENSIONS, TransferMethod } from '@/types/app'
import cn from '@/utils/classnames'
import type { VisionFile } from '@/types/app'
import ImagePreview from '@/app/components/base/image-uploader/image-preview'

type Props = {
  message_files: VisionFile[]
}

const ImageFileGallery: FC<Props> = ({
  message_files,
}) => {
  const [imagePreviewUrl, setImagePreviewUrl] = useState('')

  const isOneImage = (message_files: VisionFile[]) => {
    const isLocalOneImage = message_files.length === 1 && IMAGE_ALLOW_FILE_EXTENSIONS.includes(message_files[0].fileType?.toLowerCase())
    const isRemoteOneImage = message_files.length === 1 && message_files[0].transfer_method === TransferMethod.remote_url
    return isLocalOneImage || isRemoteOneImage
  }

  return (
    <>
      <div className="flex w-full flex-wrap justify-end">
        {isOneImage(message_files)
          ? (
            <div>
              <img
                className={s.item}
                src={message_files[0].url}
                alt=''
                onClick={() => setImagePreviewUrl(message_files[0].url)}
                onError={e => e.currentTarget.remove()}
              />
            </div>
          )
          : (
            message_files.map(item => (
              <div
                key={item.upload_file_id}
                className="w-40 group relative mr-1 mb-1 border-[0.5px] border-black/5 rounded-lg"
                style={{ backgroundColor: 'rgb(245, 245, 245)' }}
              >
                <div
                  className={`${s.fileInfo} w-full h-[40px] p-[6px] rounded-lg cursor-pointer border-[0.5px] border-black/5`}
                  style={{ backgroundColor: 'rgb(245, 245, 245)' }}
                >
                  {(IMAGE_ALLOW_FILE_EXTENSIONS.includes(item.fileType.toLowerCase()) || item.transfer_method === TransferMethod.remote_url)
                    ? (
                      <img
                        className={s.fileImage}
                        alt={item.name}
                        src={item.url}
                        onClick={() => setImagePreviewUrl(item.url)}
                      />
                    )
                    : (
                      <div className={cn(s.fileIcon, s[item.fileType.toLowerCase()])} />
                    )}

                  <div className='flex flex-col'>
                    <div className='w-28 text-left text-[var(--txt_icon_black_1,#1a2029)] text-xs leading-5 overflow-hidden whitespace-nowrap text-ellipsis'>
                      {item.name}
                    </div>
                    <div className='flex center'>
                      <div className={cn(s.type, 'w-auto mr-4 text-left text-[var(--txt_icon_black_1,#1a2029)] text-xs leading-5')}>
                        {item.fileType}
                      </div>
                      <div className={cn(s.size, 'w-auto text-left text-[var(--txt_icon_black_1,#1a2029)] text-xs leading-5')}>
                        {item.size}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            ))
          )}

        {imagePreviewUrl && (
          <ImagePreview
            url={imagePreviewUrl}
            onCancel={() => setImagePreviewUrl('')}
          />
        )}
      </div>
    </>
  )
}

export default React.memo(ImageFileGallery)
