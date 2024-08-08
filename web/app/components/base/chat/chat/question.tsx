import type {
  FC,
  ReactNode,
} from 'react'
import {
  memo,
} from 'react'
import type { ChatItem } from '../types'
import type { Theme } from '../embedded-chatbot/theme/theme-context'
import { CssTransform } from '../embedded-chatbot/theme/utils'
import { QuestionTriangle } from '@/app/components/base/icons/src/vender/solid/general'
import { User } from '@/app/components/base/icons/src/public/avatar'
import { Markdown } from '@/app/components/base/markdown'
import ImageFileGallery from '@/app/components/base/image-file-gallery'
type QuestionProps = {
  item: ChatItem
  questionIcon?: ReactNode
  theme: Theme | null | undefined
}
const Question: FC<QuestionProps> = ({
  item,
  questionIcon,
  theme,
}) => {
  const {
    content,
    message_files,
  } = item
  return (
    <div className='flex justify-end mb-2 last:mb-0 pl-10'>
      <div className='flex justify-end mb-2 last:mb-0 pl-10'>
        <div className='group relative mr-4'>
          <QuestionTriangle
            className='absolute -right-2 top-0 w-2 h-3 text-[#D1E9FF]/50'
            style={theme ? { color: theme.chatBubbleColor } : {}}
          />
          <div className='flex flex-col items-end'>
            <div
              className='inline-block px-4 py-3 mb-1 bg-[#D1E9FF]/50 rounded-b-2xl rounded-tl-2xl text-sm text-gray-900'
              style={theme?.chatBubbleColorStyle ? CssTransform(theme.chatBubbleColorStyle) : {}}
            >
              <Markdown className='w-auto' content={content} />
            </div>
            {
              !!message_files?.length && (
                <div className='mt-1'>
                  <ImageFileGallery message_files={message_files} />
                </div>
              )
            }
          </div>
          <div className='mt-1 h-[18px]' />
        </div>
      </div>

      <div className='shrink-0 w-10 h-10'>
        {
          questionIcon || (
            <div className='w-full h-full rounded-full border-[0.5px] border-black/5'>
              <User className='w-full h-full' />
            </div>
          )
        }
      </div>
    </div>
  )
}

export default memo(Question)
