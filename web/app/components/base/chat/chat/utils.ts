import { IMAGE_ALLOW_FILE_EXTENSIONS } from '@/types/app'
export const getFileType = (file: File | undefined) => {
  if (!file?.name)
    return ''
  const name = file.name
  const type = name.substring(name.lastIndexOf('.') + 1)
  return type
}
export const getFileSize = (size: number | undefined) => {
  if (!size)
    return ''
  if (size / 1024 < 1024)
    return `${(size / 1024).toFixed(2)}KB`

  return `${(size / 1024 / 1024).toFixed(2)}MB`
}

export const getFileName = (currentFile: File | undefined, maxLength: number) => {
  if (!currentFile?.name)
    return ''
  const name = currentFile.name
  const basename = name.substring(0, name.lastIndexOf('.'))
  if (basename.length <= maxLength)
    return basename
  return `${basename.slice(0, maxLength)}...`
}
export const getRemoteLinkImageType = (url: string) => {
  const ext = url.substring(url.lastIndexOf('.') + 1)
  if (IMAGE_ALLOW_FILE_EXTENSIONS.includes(ext))
    return ext.toUpperCase()
  else return 'IMAGE'
}
