'use client'
import type { FC } from 'react'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { RiQuestionLine } from '@remixicon/react'
import { useContext } from 'use-context-selector'
import Panel from '../base/feature-panel'
import ParamConfig from './param-config'
import Tooltip from '@/app/components/base/tooltip'
import Switch from '@/app/components/base/switch'
import { Eye } from '@/app/components/base/icons/src/vender/solid/general'
import ConfigContext from '@/context/debug-configuration'

const ConfigFile: FC = () => {
  const { t } = useTranslation()
  const { isShowFileConfig, fileConfig, setFileConfig } = useContext(ConfigContext)

  if (!isShowFileConfig)
    return null

  return (
    <>
      <Panel
        className="mt-4"
        headerIcon={<Eye className="w-4 h-4 text-[#6938EF]" />}
        title={
          <div className="flex items-center">
            <div className="mr-1">{t('appDebug.file.name')}</div>
            <Tooltip
              htmlContent={
                <div className="w-[180px]">
                  {t('appDebug.file.description')}
                </div>
              }
              selector="config-vision-tooltip"
            >
              <RiQuestionLine className="w-[14px] h-[14px] text-gray-400" />
            </Tooltip>
          </div>
        }
        headerRight={
          <div className="flex items-center">
            <ParamConfig />
            <div className="ml-4 mr-3 w-[1px] h-3.5 bg-gray-200"></div>
            <Switch
              defaultValue={fileConfig.enabled}
              onChange={value =>
                setFileConfig({
                  ...fileConfig,
                  enabled: value,
                })
              }
              size="md"
            />
          </div>
        }
        noBodySpacing
      />
    </>
  )
}
export default React.memo(ConfigFile)
