import type { FC } from 'react'
import classNames from '@/utils/classnames'

type LogoSiteProps = {
  className?: string
}

const LogoSite: FC<LogoSiteProps> = ({
  className,
}) => {
  return (
    <img
      src='/logo/sl-logo-site2.png'
      className={classNames('block w-auto h-10', className)}
      alt='logo'
    />
  )
}

export default LogoSite
