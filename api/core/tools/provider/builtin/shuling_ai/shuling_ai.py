from typing import Any

from core.tools.errors import ToolProviderCredentialValidationError
from core.tools.provider.builtin.shuling_ai.tools.oi_code import OICodeTool
from core.tools.provider.builtin_tool_provider import BuiltinToolProviderController


class ShulingAIProvider(BuiltinToolProviderController):
    def _validate_credentials(self, credentials: dict[str, Any]) -> None:
        try:
            # 1. 此处需要使用 OICodeTool()实例化一个 OICodeTool，它会自动加载 OICodeTool 的 yaml
            # 2. 随后需要使用 fork_tool_runtime 方法，将当前的凭据信息传递给 OICodeTool
            # 3. 最后 invoke 即可，参数需要根据 OICodeTool 的 yaml 中配置的参数规则进行传递
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