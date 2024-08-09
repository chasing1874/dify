'use client'
import type { FC } from 'react'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import OptionCard from '@/app/components/workflow/nodes/_base/components/option-card'
import { ResolutionFile } from '@/types/app'

const i18nPrefix = 'workflow.nodes.llm'

type Props = {
  value: ResolutionFile
  onChange: (value: ResolutionFile) => void
}

const ResolutionFilePicker: FC<Props> = ({
  value,
  onChange,
}) => {
  const { t } = useTranslation()

  const handleOnChange = useCallback((value: ResolutionFile) => {
    return () => {
      onChange(value)
    }
  }, [onChange])
  return (
    <div className='flex items-center justify-between'>
      <div className='mr-2 text-xs font-medium text-gray-500 uppercase'>{t(`${i18nPrefix}.resolution.name`)}</div>
      <div className='flex items-center space-x-1'>
        <OptionCard
          title={t(`${i18nPrefix}.resolutionFile.M1`)}
          onSelect={handleOnChange(ResolutionFile.M1)}
          selected={value === (ResolutionFile.M2 || ResolutionFile.M3)}
        />
        <OptionCard
          title={t(`${i18nPrefix}.resolutionFile.M1`)}
          onSelect={handleOnChange(ResolutionFile.M1)}
          selected={value === (ResolutionFile.M2 || ResolutionFile.M3)}
        />
      </div>
    </div>
  )
}
export default React.memo(ResolutionFilePicker)
