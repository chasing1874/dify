from typing import Any

from core.tools.errors import ToolProviderCredentialValidationError
from core.tools.provider.builtin.open_interpreter.tools.oi_code import OICodeTool
from core.tools.provider.builtin_tool_provider import BuiltinToolProviderController


class OpenInterpreterProvider(BuiltinToolProviderController):
    def _validate_credentials(self, credentials: dict[str, Any]) -> None:
        try:
            # 1. 此处需要使用 GoogleSearchTool()实例化一个 GoogleSearchTool，它会自动加载 GoogleSearchTool 的 yaml 配置，但是此时它内部没有凭据信息
            # 2. 随后需要使用 fork_tool_runtime 方法，将当前的凭据信息传递给 GoogleSearchTool
            # 3. 最后 invoke 即可，参数需要根据 GoogleSearchTool 的 yaml 中配置的参数规则进行传递
            OICodeTool().fork_tool_runtime(
                runtime={
                    "credentials": credentials,
                }
            ).invoke(
                user_id='test_user',
                tool_parameters={
                    "language": "python",
                    "code": "print('hello world')"
                }
            )
        except Exception as e:
            raise ToolProviderCredentialValidationError(str(e))