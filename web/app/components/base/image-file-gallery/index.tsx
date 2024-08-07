'use client'
import type { FC } from 'react'
import React, { useState } from 'react'
import s from './style.module.css'
import { IMAGE_ALLOW_FILE_EXTENSIONS } from '@/types/app'
import cn from '@/utils/classnames'
import type { VisionFile } from '@/types/app'
import ImagePreview from '@/app/components/base/image-uploader/image-preview'

type Props = {
  message_files: VisionFile[]
}

// const getWidthStyle = (imgNum: number) => {
//   if (imgNum === 1) {
//     return {
//       maxWidth: '100%',
//     }
//   }

//   if (imgNum === 2 || imgNum === 4) {
//     return {
//       width: 'calc(50% - 4px)',
//     }
//   }

//   return {
//     width: 'calc(33.3333% - 5.3333px)',
//   }
// }

const ImageFileGallery: FC<Props> = ({
  message_files,
}) => {
  const [imagePreviewUrl, setImagePreviewUrl] = useState('')
  console.log(message_files)

  return (
    <>
      <div className="flex w-full flex-wrap">
        {/* [width:calc(33.33333%-5.33333px)] */}
        {message_files.map(item => (
          <div
            key={item.id}
            className="group relative mr-1 border-[0.5px] border-black/5 rounded-lg"
            style={{ backgroundColor: '#f5f5f5', borderRadius: '4px' }}
          >
            <div
              className={`${s.fileInfo} h-[40px] p-[6px] rounded-lg  cursor-pointer border-[0.5px] border-black/5 bg-[var(--floating_stroke_grey_1,#f5f5f5)`}
            >

              {/* 对图片的单独处理 */}
              {/* isImageType 返回true,直接将图片放到这里，如果为false 使用下面的fileIcon */}
              {IMAGE_ALLOW_FILE_EXTENSIONS.includes(item.type)
                ? (
                  <img
                    className={s.fileImage}
                    alt={item.file?.name}
                    src={
                      item.url
                    }
                    onClick={() =>
                      setImagePreviewUrl(
                        item.url as string,
                      )
                    }
                  />
                )
                : (
                  <div className={cn(s.fileIcon, s[item.type])} />
                )}

              {/* <div className={cn(s.fileIcon, s[getFileType(item.file)])} /> */}
              <div className='flex flex-col'>
                <div className='w-full text-left text-[var(--txt_icon_black_1,#1a2029)] text-xs leading-5' >{item.name}</div>
                <div className='flex center'>
                  <div className={cn(s.type, 'w-auto mr-4 text-left text-[var(--txt_icon_black_1,#1a2029)] text-xs leading-5')}>{item.type.toUpperCase()}</div>
                  <div className={cn(s.size, 'w-auto text-left text-[var(--txt_icon_black_1,#1a2029)] text-xs leading-5')}>{item.size}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
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

export const ImageFileGalleryTest = () => {
  const imgGallerySrcs = (() => {
    const srcs = []
    for (let i = 0; i < 6; i++)
      // srcs.push('https://placekitten.com/640/360')
      // srcs.push('https://placekitten.com/360/640')
      srcs.push('https://placekitten.com/360/360')

    return srcs
  })()
  return (
    <div className='space-y-2'>
      {imgGallerySrcs.map((_, index) => (
        <div key={index} className='p-4 pb-2 rounded-lg bg-[#D1E9FF80]'>
          <ImageFileGallery srcs={imgGallerySrcs.slice(0, index + 1)} />
        </div>
      ))}
    </div>
  )
}
