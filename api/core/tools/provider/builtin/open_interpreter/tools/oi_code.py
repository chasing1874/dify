import base64
import logging
from typing import Any, Union

import requests

from core.tools.entities.tool_entities import ToolInvokeMessage, ToolParameter, ToolRuntimeVariable
from core.tools.tool.builtin_tool import BuiltinTool

logger = logging.getLogger(__name__)

class OICodeTool(BuiltinTool):
    def _invoke(self, 
                user_id: str,
               tool_parameters: dict[str, Any], 
        ) -> Union[ToolInvokeMessage, list[ToolInvokeMessage]]:
        """
            invoke tools
        """

        logger.info(f"OI code, user_id: {user_id}")

        logger.info(f'tool_parameters: {tool_parameters}')
        logger.info(f'xxx variables: {self.variables}')
        runtime_variables = self.variables
        user_id = runtime_variables.user_id
        conversation_id = runtime_variables.conversation_id
        pool: list[ToolRuntimeVariable] = runtime_variables.pool
        logger.info(f'user_id: {user_id}, conversation_id: {conversation_id}, pool: {pool}')


        language, code, upload_files = tool_parameters.get("language"), tool_parameters.get("code"), tool_parameters.get("upload_files")
        logger.info(f'language: {language}, code: {code}, upload_files: {upload_files}')

        api_server = self.runtime.credentials['SLAI_api_server']
        data = {
            'user_id': user_id,
            'language': language,
            'code': code,
            'upload_files': upload_files
        }
        response = requests.post(
            url=api_server + '/run',
            json=data
        )

        try:
            resp = response.json()
        except:
            raise Exception('oi_code_res error')
        print(f'oi_res: {resp}')

        if resp['code'] != 200:
            return self.create_text_message(text=resp['msg'])
        
        final_output = resp['result']['final_output']
        pic_list = resp['result']['pic_list']
        file_list = resp['result']['file_list']
        print(f'final_output: {final_output}, pic_list: {pic_list}, file_list: {file_list}')

        res_list = []
        if final_output:
            if isinstance(final_output, list):
                for item in final_output:
                    content = item['content']
                    if item['type'] == 'console':
                        res_list.append(self.create_text_message(text=content))
                    if item['type'] == 'image':
                        buffer = base64.b64decode(content)
                        meta = {'mime_type': 'image/png'}
                        res_list.append(self.create_blob_message(blob=buffer, meta=meta))
            else:
                content = final_output['content']
                if final_output['type'] == 'console':
                    res_list.append(self.create_text_message(text=content))
                if final_output['type'] == 'image':
                    buffer = base64.b64decode(content)
                    meta = {'mime_type': 'image/png'}
                    res_list.append(self.create_blob_message(blob=buffer, meta=meta))
        if pic_list:
            for item in pic_list:
                res_list.append(self.create_link_message(link=item))
        if file_list:
            for item in file_list:
                res_list.append(self.create_link_message(link=item))
        return res_list
    
    def get_runtime_parameters(self) -> list[ToolParameter]:
        """
        override the runtime parameters
        """
        logger.info('get_runtime_parameters')
        return [
            ToolParameter.get_simple_instance(
                name='upload_file_url',
                llm_description='when recieve file link, then the plugin will save it to *"./workspace"*',
                type=ToolParameter.ToolParameterType.STRING,
                required=False,
            )
        ]