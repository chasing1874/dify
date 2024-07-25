import type { FC } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from '@/app/components/base/button'
import type { ImageFile } from '@/types/app'
import { TransferMethod } from '@/types/app'

type FileLinkInputProps = {
  onUpload: (imageFile: ImageFile) => void
  disabled?: boolean
}
const regex = /^(https?|ftp):\/\//
const FileLinkInput: FC<FileLinkInputProps> = ({
  onUpload,
  disabled,
}) => {
  const { t } = useTranslation()
  const [fileLink, setFileLink] = useState('')

  const handleClick = () => {
    if (disabled)
      return

    const imageFile = {
      type: TransferMethod.remote_url,
      _id: `${Date.now()}`,
      fileId: '',
      progress: regex.test(fileLink) ? 0 : -1,
      url: fileLink,
    }

    onUpload(imageFile)
  }

  return (
    <div className='flex items-center pl-1.5 pr-1 h-8 border border-gray-200 bg-white shadow-xs rounded-lg'>
      <input
        type="text"
        className='grow mr-0.5 px-1 h-[18px] text-[13px] outline-none appearance-none'
        value={fileLink}
        onChange={e => setFileLink(e.target.value)}
        placeholder={t('common.fileUploader.pasteFileLinkInputPlaceholder') || ''}
      />
      <Button
        variant='primary'
        size='small'
        disabled={!fileLink || disabled}
        onClick={handleClick}
      >
        {t('common.operation.ok')}
      </Button>
    </div>
  )
}

export default FileLinkInput
