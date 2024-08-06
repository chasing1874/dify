from json import dumps
import logging
from core.tools.tool.builtin_tool import BuiltinTool
from core.tools.entities.tool_entities import ToolInvokeMessage
import requests

from typing import Any, Dict, List, Union

logger = logging.getLogger(__name__)

class OICodeTool(BuiltinTool):
    def _invoke(self, 
                user_id: str,
               tool_parameters: Dict[str, Any], 
        ) -> Union[ToolInvokeMessage, List[ToolInvokeMessage]]:
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
                content = ''
                for item in final_output:
                    content += item['content']
            else:
                content = final_output['content']
            res_list.append(self.create_text_message(text=content))
        if pic_list:
            for item in pic_list:
                res_list.append(self.create_image_message(image=item))
        if file_list:
            for item in file_list:
                res_list.append(self.create_link_message(file_var=item))
        return res_list