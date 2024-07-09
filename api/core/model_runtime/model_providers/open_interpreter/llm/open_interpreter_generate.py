from collections.abc import Generator
from enum import Enum
from json import dumps, loads
from typing import Any, Union
import uuid
from PIL import Image
from io import BytesIO
import base64
from pydantic import BaseModel
from typing import Union, Literal, Dict, Optional

from requests import Response, post
from requests.exceptions import ConnectionError, InvalidSchema, MissingSchema

from core.model_runtime.entities.message_entities import PromptMessageContent, SheetPromptMessageContent, TextPromptMessageContent
from core.model_runtime.model_providers.openllm.llm.openllm_generate_errors import (
    BadRequestError,
    InternalServerError,
    InvalidAPIKeyError,
    InvalidAuthenticationError,
)

from extensions.ext_storage import storage

class Message(BaseModel):
    role: Literal["user", "assistant", "computer"]
    type: Literal["message", "code", "image", "console", "file", "confirmation"]
    format: Optional[Literal["output", "path", "base64.png", "base64.jpeg", "python", "javascript", "shell", "html", "active_line", "execution"]] = None
    recipient: Optional[Literal["user", "assistant"]] = None
    content: Optional[Union[str, int, Dict[str, Union[str, dict]]]] = None # 如果dict需要有特定的结构，可以定义一个更详细的类型

class StreamingChunk(Message):
    start: Optional[bool] = None
    end: Optional[bool] = None


class OpenInterpreterGenerateMessage:
    class Role(Enum):
        USER = 'user'
        ASSISTANT = 'assistant'
        SYSTEM = 'system'

    role: str = Role.USER.value
    type: str = 'message'
    format: str
    content: Optional[str | list[PromptMessageContent]] = None
    usage: dict[str, int] = None
    stop_reason: str = ''

    def to_dict(self) -> dict[str, Any]:
        if self.type == 'code':
            return {
                'role': self.role,
                'type': self.type,
                'format': self.format,
                'content': self.content
            }
        else:
            return {
                'role': self.role,
                'type': self.type,
                'content': self.content,
            }
    
    def __init__(self, content: str | list[PromptMessageContent], role: str = 'user', type: str = 'message') -> None:
        self.content = content
        self.role = role
        self.type = type


class OpenInterpreterGenerate:
    is_console_out: bool = False

    def generate(
            self, server_url: str, api_key: str, model_name: str, stream: bool, model_parameters: dict[str, Any],
            stop: list[str], prompt_messages: list[OpenInterpreterGenerateMessage], user: str,
    ) -> Union[Generator[OpenInterpreterGenerateMessage, None, None], OpenInterpreterGenerateMessage]:
        if not api_key or not server_url:
            raise InvalidAuthenticationError('api_key is required')

        conversation_id = model_parameters.get('conversation_id', '')
        if not conversation_id or conversation_id == '':
            raise BadRequestError('conversation_id is required')

        prompt = self._handle_prompt(prompt_messages)
        data = {
            'prompt': prompt,
            'files': self._handle_files(prompt_messages),
            'system_prompt': self._handle_system_prompt(prompt_messages),
            'stop': stop,
            'user': user,
            'model_name': model_name,
            'api_key': api_key,
            'conversation_id': conversation_id,
            'model_parameters': model_parameters,
        }

        print('generate, data: ', data)


        method = "/stream_chat" if stream else "/chat"
        try:
            response = post(
                url= server_url + method,
                headers={'Content-Type': 'application/json'} ,
                data=dumps(data),
                timeout=180,
                stream=stream
            )
        except Exception as e:
            raise InternalServerError(f"Failed to invoke model: {e}")
        
        if response.status_code != 200:
            try:
                resp = response.json()
                # try to parse error message
                err = resp['error']['code']
                msg = resp['error']['message']
            except Exception as e:
                raise InternalServerError(f"Failed to convert response to json: {e} with text: {response.text}")

            if err == 'invalid_api_key':
                raise InvalidAPIKeyError(msg)
            else:
                raise InternalServerError(f"Unknown error: {err} with message: {msg}")
        prompt_tokens = len(prompt.split())
        if stream:
            return self._handle_chat_stream_generate_response(prompt_tokens, response)
        return self._handle_chat_generate_response(prompt_tokens, response)
    
    def _handle_files(self, prompt_messages: list[OpenInterpreterGenerateMessage]) -> list[dict]:
        files = []
        if len(prompt_messages) == 0:
            return files
        message = prompt_messages[-1]
        content = message.content
        if isinstance(content, list):
            for item in content:
                if isinstance(item, SheetPromptMessageContent):
                    file = {
                        'suffix': item.suffix.name,
                        'sheet_name': item.sheet_name,
                        'file_path': item.file_path,
                        'tenant_id': item.tenant_id
                    }
                    files.append(file)
        return files
    
    def _handle_prompt(self, prompt_messages: list[OpenInterpreterGenerateMessage]) -> str:
        prompt = ''
        if len(prompt_messages) == 0:
            return prompt
        message = prompt_messages[-1]
        content = message.content
        if isinstance(content, str):
            prompt += content
            prompt += '\n'
        if isinstance(content, list):
            for item in content:
                if isinstance(item, TextPromptMessageContent):
                    prompt += item.data
                    prompt += '\n'
        return prompt
    
    def _handle_system_prompt(self, prompt_messages: list[OpenInterpreterGenerateMessage]) -> str:
        system_prompt = ''
        if len(prompt_messages) == 0:
            return system_prompt
        message = prompt_messages[0]
        if message.role == OpenInterpreterGenerateMessage.Role.SYSTEM.value:
            content = message.content
            if isinstance(content, str):
                system_prompt += '\n'
                system_prompt += content
        return system_prompt

        
    def _handle_chat_generate_response(self, prompt_tokons: int, response: Response) -> OpenInterpreterGenerateMessage:

        resp = response.json()

        resultMsg = resp[0]

        message = OpenInterpreterGenerateMessage(content=resultMsg['content'],
                                                 role=OpenInterpreterGenerateMessage.Role.ASSISTANT.value,
                                                 type=resultMsg['type'])
        message.usage = {
            'prompt_tokens': prompt_tokons,
            'completion_tokens': len(resultMsg['content'].split()),
            'total_tokens': prompt_tokons + len(resultMsg['content'].split())
        }

        return message

    def _handle_chat_stream_generate_response(self, prompt_tokons: int, response: Response) -> Generator[OpenInterpreterGenerateMessage, None, None]:
        

        for chunk in response.iter_content(chunk_size=None, decode_unicode=True): 
            if chunk.startswith('data:'):
                chunk = chunk[5:].strip()

            try:
                data = StreamingChunk.parse_raw(chunk)
                content = self._format_response(data)
            except Exception as e:
                raise BadRequestError(f"Failed to parse response: {e}, with text: {chunk}")
            
            print(f'content: {content}')

            if isinstance(content, str):
                completion_tokens = len(content.split())
            else:
                content = ''
                completion_tokens = 0
            
            message = OpenInterpreterGenerateMessage(content=content, 
                                                     role=OpenInterpreterGenerateMessage.Role.ASSISTANT.value,
                                                     type=data.type)
            
            
            message.usage = {
                'prompt_tokens': prompt_tokons,
                'completion_tokens': completion_tokens,
                'total_tokens': prompt_tokons + completion_tokens
            }
            

            yield message
    
    def _format_response(self, chunk: StreamingChunk):
        full_response = ""
        # Message
        if chunk.type == "message":
            if chunk.content is not None:
                full_response += chunk.content
            if chunk.end:
                full_response += "\n"

        # Code
        if chunk.type == "code":
            format = chunk.format if chunk.format is not None else "text"
            if chunk.start:
                full_response += "\n📌 ***Code***\n"
                full_response = full_response + "```" + format + "\n"
            if chunk.content is not None:
                full_response += chunk.content
            if chunk.end:
                full_response += "\n```\n"

        # confirmation 暂不需要confirmation
        # if chunk['type'] == "confirmation":
        #     if chunk.get('start', False):
        #         full_response += "```python\n"
        #     full_response += chunk.get('content', {}).get('content', '')
        #     if chunk.get('end', False):
        #         full_response += "```\n"

        # # Output
        # if chunk['type'] == "confirmation":
        #     if chunk.get('start', False):
        #         full_response += "```python\n"
        #     full_response += chunk.get('content', {}).get('code', '')
        #     if chunk.get('end', False):
        #         full_response += "```\n"

        # Console
        if chunk.type == "console":
            if chunk.start:
                full_response += "\n✅ ***Result***\n"
                full_response += "```\n"
            # if chunk.format == "active_line":
            #     if chunk.content is None and self.is_console_out == False:
            #         full_response += "The code execution is complete!"
            if chunk.format == "output":
                if chunk.content is not None and chunk.content != "HTML being displayed on the user's machine...":
                    full_response += chunk.content
                    if len(full_response) > 0:
                        self.is_console_out = True
            if chunk.end:
                if self.is_console_out == False:
                    full_response += "The code execution is complete!"
                full_response += "\n```\n"
                self.is_console_out = False

        # Image
        if chunk.type == "image":
            if chunk.start or chunk.end:
                full_response += "\n"
            else:
                if chunk.format == 'base64.png':
                    if chunk.content is not None:
                        image = Image.open(
                            BytesIO(base64.b64decode(chunk.content)))
                        new_image = Image.new("RGB", image.size, "white")
                        new_image.paste(image, mask=image.split()[3])
                        # buffered = BytesIO()
                        # new_image.save(buffered, format="PNG")
                        # img_str = base64.b64encode(buffered.getvalue()).decode()
                        # full_response += f"![Image](data:image/png;base64,{img_str})\n"

                        # 保存图片到指定目录
                        save_path = '/mnt/data/' + str(uuid.uuid4()) + '.' + 'png'
                        new_image.save(save_path, format="PNG")
                        full_response += f"![Image]({save_path})"

        return full_response
        