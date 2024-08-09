import { v4 as uuidV4 } from 'uuid'
import { IMAGE_ALLOW_FILE_EXTENSIONS, TransferMethod } from '@/types/app'
const getRemoteLinkImageType = (url: string) => {
  const ext = url.substring(url.lastIndexOf('.') + 1)
  if (IMAGE_ALLOW_FILE_EXTENSIONS.includes(ext))
    return ext.toUpperCase()
  else return 'IMAGE'
}

export const getFileType = (file: File | undefined, type: string, url: string) => {
  if (type === TransferMethod.remote_url)
    return getRemoteLinkImageType(url)
  if (!file?.name)
    return 'unknown'
  const name = file.name
  return name.substring(name.lastIndexOf('.') + 1).toUpperCase()
}
export const getFileSize = (file: File | undefined, type: string) => {
  if (type === TransferMethod.remote_url)
    return 'unknown'
  if (!file?.size)
    return 'unknown'
  if (file.size / 1024 < 1024)
    return `${(file.size / 1024).toFixed(2)}KB`

  return `${(file.size / 1024 / 1024).toFixed(2)}MB`
}

export const getFileName = (currentFile: File | undefined, maxLength: number, type: string) => {
  // remote_url name uuid
  if (type === TransferMethod.remote_url)
    return `image-${uuidV4().substring(0, maxLength - 5)}...`
  if (!currentFile?.name)
    return ''
  const name = currentFile.name
  const basename = name.substring(0, name.lastIndexOf('.'))
  if (basename.length <= maxLength)
    return basename
  return `${basename.slice(0, maxLength)}...`
}
