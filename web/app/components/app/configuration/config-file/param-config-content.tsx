'use client'
import type { FC } from 'react'
import React from 'react'
import { useContext } from 'use-context-selector'
import { useTranslation } from 'react-i18next'
import { RiQuestionLine } from '@remixicon/react'
import RadioGroup from './radio-group'
import ConfigContext from '@/context/debug-configuration'
import { ResolutionFile, TransferMethod } from '@/types/app'
import ParamItem from '@/app/components/base/param-item'
import Tooltip from '@/app/components/base/tooltip'

const MIN = 1
const MAX = 6
const ParamConfigContent: FC = () => {
  const { t } = useTranslation()

  const { fileConfig, setFileConfig } = useContext(ConfigContext)

  // 配置本地上传 还是链接
  const transferMethod = (() => {
    console.log(fileConfig, 'fileConfig')
    if (
      !fileConfig.transfer_methods
      || fileConfig.transfer_methods.length === 2
    )
      return TransferMethod.all

    return fileConfig.transfer_methods[0]
  })()

  return (
    <div>
      <div>
        <div className="leading-6 text-base font-semibold text-gray-800">
          {t('appDebug.file.fileSettings.title')}
        </div>
        <div className="pt-3 space-y-6">
          {/* 文件大小设置 */}
          <div>
            <div className="mb-2 flex items-center  space-x-1">
              <div className="leading-[18px] text-[13px] font-semibold text-gray-800">
                {t('appDebug.file.fileSettings.resolution')}
              </div>
              <Tooltip
                htmlContent={
                  <div className="w-[180px]">
                    {t('appDebug.file.fileSettings.resolutionTooltip')
                      .split('\n')
                      .map(item => (
                        <div key={item}>{item}</div>
                      ))}
                  </div>
                }
                selector="config-resolution-tooltip"
              >
                <RiQuestionLine className="w-[14px] h-[14px] text-gray-400" />
              </Tooltip>
            </div>
            <RadioGroup
              className="space-x-3"
              options={[
                {
                  label: t('appDebug.file.fileSettings.M1'),
                  value: ResolutionFile.M1,
                },
                {
                  label: t('appDebug.file.fileSettings.M2'),
                  value: ResolutionFile.M2,
                },
                {
                  label: t('appDebug.file.fileSettings.M3'),
                  value: ResolutionFile.M3,
                },
              ]}
              value={fileConfig.detail}
              onChange={(value: ResolutionFile) => {
                setFileConfig({
                  ...fileConfig,
                  detail: value,
                })
              }}
            />
          </div>
          <div>
            <div className="mb-2 leading-[18px] text-[13px] font-semibold text-gray-800">
              {t('appDebug.file.fileSettings.uploadMethod')}
            </div>
            <RadioGroup
              className="space-x-3"
              options={[
                {
                  label: t('appDebug.file.fileSettings.both'),
                  value: TransferMethod.all,
                },
                {
                  label: t('appDebug.file.fileSettings.localUpload'),
                  value: TransferMethod.local_file,
                },
                {
                  label: t('appDebug.file.fileSettings.url'),
                  value: TransferMethod.remote_url,
                },
              ]}
              value={transferMethod}
              onChange={(value: TransferMethod) => {
                if (value === TransferMethod.all) {
                  setFileConfig({
                    ...fileConfig,
                    transfer_methods: [
                      TransferMethod.remote_url,
                      TransferMethod.local_file,
                    ],
                  })
                  return
                }
                setFileConfig({
                  ...fileConfig,
                  transfer_methods: [value],
                })
              }}
            />
          </div>
          <div>
            <ParamItem
              id="upload_limit"
              className=""
              name={t('appDebug.file.fileSettings.uploadLimit')}
              noTooltip
              {...{
                default: 2,
                step: 1,
                min: MIN,
                max: MAX,
              }}
              value={fileConfig.number_limits}
              enable={true}
              onChange={(_key: string, value: number) => {
                if (!value)
                  return
                setFileConfig({
                  ...fileConfig,
                  number_limits: value,
                })
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo(ParamConfigContent)
