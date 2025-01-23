#include <node_api.h>
#include <windows.h>
#include <stdio.h>
#include <stdlib.h>

// Struct for async data
typedef struct {
    napi_env env;
    napi_deferred deferred;
    napi_ref callback; // Optional, for callback-based usage
    int keycode;       // For keypress
    char* text;        // For typing
    size_t text_length;
    char* error_message;
} AsyncData;

// Function to execute keypress in the worker thread
void ExecuteKeypress(napi_env env, void* data) {
    AsyncData* worker = (AsyncData*)data;

    // Simulate keypress
    INPUT inputs[2] = {0};
    inputs[0].type = INPUT_KEYBOARD;
    inputs[0].ki.wVk = (WORD)worker->keycode; // Key press
    inputs[0].ki.dwFlags = 0;

    inputs[1].type = INPUT_KEYBOARD;
    inputs[1].ki.wVk = (WORD)worker->keycode; // Key release
    inputs[1].ki.dwFlags = KEYEVENTF_KEYUP;

    UINT sent = SendInput(2, inputs, sizeof(INPUT));
    if (sent != 2) {
        worker->error_message = "Failed to send input";
    }
}

// Function to execute typing in the worker thread
void ExecuteTyping(napi_env env, void* data) {
    AsyncData* worker = (AsyncData*)data;

    // Simulate typing each character
    for (size_t i = 0; i < worker->text_length; ++i) {
        char c = worker->text[i];
        SHORT vk = VkKeyScan(c);
        if (vk == -1) {
            worker->error_message = "Failed to map character to virtual key";
            return;
        }

        INPUT inputs[2] = {0};
        inputs[0].type = INPUT_KEYBOARD;
        inputs[0].ki.wVk = LOBYTE(vk);
        inputs[0].ki.dwFlags = 0; // Key press

        inputs[1].type = INPUT_KEYBOARD;
        inputs[1].ki.wVk = LOBYTE(vk);
        inputs[1].ki.dwFlags = KEYEVENTF_KEYUP; // Key release

        SendInput(2, inputs, sizeof(INPUT));
    }
}

// Completion callback for both keypress and typing
void CompleteWork(napi_env env, napi_status status, void* data) {
    AsyncData* worker = (AsyncData*)data;

    if (worker->error_message) {
        napi_value error;
        napi_create_string_utf8(env, worker->error_message, NAPI_AUTO_LENGTH, &error);
        napi_reject_deferred(env, worker->deferred, error);
    } else {
        napi_value result;
        napi_get_undefined(env, &result);
        napi_resolve_deferred(env, worker->deferred, result);
    }

    // Cleanup
    if (worker->text) free(worker->text);
    napi_delete_async_work(env, worker->work);
    free(worker);
}

// Async keypress function
napi_value SimulateKeypressAsync(napi_env env, napi_callback_info args) {
    size_t argc = 1;
    napi_value argv[1];
    napi_status status;

    // Parse arguments
    status = napi_get_cb_info(env, args, &argc, argv, NULL, NULL);
    if (status != napi_ok || argc < 1) {
        napi_throw_error(env, NULL, "Keycode argument is required");
        return NULL;
    }

    int keycode;
    status = napi_get_value_int32(env, argv[0], &keycode);
    if (status != napi_ok) {
        napi_throw_error(env, NULL, "Invalid keycode");
        return NULL;
    }

    // Create async worker
    AsyncData* worker = (AsyncData*)malloc(sizeof(AsyncData));
    if (!worker) {
        napi_throw_error(env, NULL, "Memory allocation failed");
        return NULL;
    }
    worker->env = env;
    worker->keycode = keycode;
    worker->error_message = NULL;

    napi_value promise;
    napi_create_promise(env, &worker->deferred, &promise);

    napi_value work_name;
    napi_create_string_utf8(env, "SimulateKeypressAsync", NAPI_AUTO_LENGTH, &work_name);
    napi_create_async_work(env, NULL, work_name, ExecuteKeypress, CompleteWork, worker, &worker->work);
    napi_queue_async_work(env, worker->work);

    return promise;
}

// Async typing function
napi_value SimulateTypingAsync(napi_env env, napi_callback_info args) {
    size_t argc = 1;
    napi_value argv[1];
    napi_status status;

    // Parse arguments
    status = napi_get_cb_info(env, args, &argc, argv, NULL, NULL);
    if (status != napi_ok || argc < 1) {
        napi_throw_error(env, NULL, "Text argument is required");
        return NULL;
    }

    // Get string size
    size_t text_length;
    size_t text_length_copied;
    status = napi_get_value_string_utf8(env, argv[0], NULL, 0, &text_length);
    if (status != napi_ok) {
        napi_throw_error(env, NULL, "Failed to get string size");
        return NULL;
    }

    // Get string value
    char* text = (char*)malloc(text_length + 1);
    if (!text) {
        napi_throw_error(env, NULL, "Memory allocation failed");
        return NULL;
    }
    status = napi_get_value_string_utf8(env, argv[0], text, text_length + 1, &text_length_copied);
    if (status != napi_ok) {
        free(text);
        napi_throw_error(env, NULL, "Failed to get string value");
        return NULL;
    }

    // Create async worker
    AsyncData* worker = (AsyncData*)malloc(sizeof(AsyncData));
    if (!worker) {
        free(text);
        napi_throw_error(env, NULL, "Memory allocation failed");
        return NULL;
    }
    worker->env = env;
    worker->text = text;
    worker->text_length = text_length_copied;
    worker->error_message = NULL;

    napi_value promise;
    napi_create_promise(env, &worker->deferred, &promise);

    napi_value work_name;
    napi_create_string_utf8(env, "SimulateTypingAsync", NAPI_AUTO_LENGTH, &work_name);
    napi_create_async_work(env, NULL, work_name, ExecuteTyping, CompleteWork, worker, &worker->work);
    napi_queue_async_work(env, worker->work);

    return promise;
}

// Module initialization
napi_value Init(napi_env env, napi_value exports) {
    napi_status status;
    napi_value fn;

    // Export SimulateKeypressAsync
    status = napi_create_function(env, NULL, 0, SimulateKeypressAsync, NULL, &fn);
    if (status != napi_ok) {
        napi_throw_error(env, NULL, "Failed to create SimulateKeypressAsync");
        return NULL;
    }
    status = napi_set_named_property(env, exports, "simulateKeypressAsync", fn);
    if (status != napi_ok) {
        napi_throw_error(env, NULL, "Failed to set SimulateKeypressAsync");
        return NULL;
    }

    // Export SimulateTypingAsync
    status = napi_create_function(env, NULL, 0, SimulateTypingAsync, NULL, &fn);
    if (status != napi_ok) {
        napi_throw_error(env, NULL, "Failed to create SimulateTypingAsync");
        return NULL;
    }
    status = napi_set_named_property(env, exports, "simulateTypingAsync", fn);
    if (status != napi_ok) {
        napi_throw_error(env, NULL, "Failed to set SimulateTypingAsync");
        return NULL;
    }

    return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
