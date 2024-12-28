#include <node_api.h>
#include <stdio.h>

// Function to return "Hello, World!"
napi_value HelloWorld(napi_env env, napi_callback_info info) {
    napi_value result;
    napi_create_string_utf8(env, "Hello, World!", NAPI_AUTO_LENGTH, &result);
    return result;
}

// Module Initialization
napi_value Init(napi_env env, napi_value exports) {
    napi_property_descriptor desc = {"helloWorld", 0, HelloWorld, 0, 0, 0, napi_default, 0};
    napi_define_properties(env, exports, 1, &desc);
    return exports;
}

// Macro for Node.js module registration
NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
