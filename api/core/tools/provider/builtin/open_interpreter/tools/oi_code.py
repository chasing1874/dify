import logging
from typing import Any, Union

import requests

from core.tools.entities.tool_entities import ToolInvokeMessage
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

        language, code, upload_file_name, upload_file_url = tool_parameters.get("language"), tool_parameters.get("code"), tool_parameters.get("upload_file_name"), tool_parameters.get("upload_file_url")
        logger.info(f'language: {language}, code: {code}, upload_file_name: {upload_file_name}, upload_file_url: {upload_file_url}')

        api_server = self.runtime.credentials['SLAI_api_server']
        data = {
            'user_id': user_id,
            'language': language,
            'code': code,
            'upload_file_name': upload_file_name,
            'upload_file_url': upload_file_url
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
                        image_base64_url = f'data:image/png;base64,{content}'
                        # res_list.append(self.create_image_message(image=image_base64_url))
            else:
                content = final_output['content']
                if final_output['type'] == 'console':
                    res_list.append(self.create_text_message(text=content))
                if final_output['type'] == 'image':
                    image_base64_url = f'data:image/png;base64,{content}'
                    # res_list.append(self.create_image_message(image=image_base64_url))
        if pic_list:
            for item in pic_list:
                res_list.append(self.create_image_message(image=item))
        if file_list:
            for item in file_list:
                res_list.append(self.create_link_message(file_var=item))
        return res_list