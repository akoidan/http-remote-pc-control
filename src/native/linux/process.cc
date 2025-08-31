#include <napi.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <vector>
#include <string>
#include <cstring>
#include "./headers/process.h"

static Napi::Number createProcess(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsString()) {
        throw Napi::TypeError::New(env, "createProcess(path: string, cmd?: string)");
    }

    std::string path = info[0].ToString().Utf8Value();
    std::string cmd;
    if (info.Length() > 1 && info[1].IsString()) {
        cmd = info[1].ToString().Utf8Value();
    }

    pid_t pid = fork();
    if (pid == -1) {
        throw Napi::Error::New(env, "fork failed");
    }

    if (pid == 0) {
        // Child: execute the process
        // Build argv: [path, cmd tokens..., nullptr]
        std::vector<char*> argv;
        argv.push_back(const_cast<char*>(path.c_str()));

        // Tokenize cmd by spaces (simple split)
        std::vector<std::string> tokens;
        std::string current;
        for (size_t i = 0; i < cmd.size(); ++i) {
            char c = cmd[i];
            if (c == ' ') {
                if (!current.empty()) { tokens.push_back(current); current.clear(); }
            } else {
                current.push_back(c);
            }
        }
        if (!current.empty()) tokens.push_back(current);

        for (auto& t : tokens) {
            argv.push_back(const_cast<char*>(t.c_str()));
        }
        argv.push_back(nullptr);

        execvp(path.c_str(), argv.data());
        // If execvp returns, it's an error
        _exit(127);
    }

    // Parent: return child's PID
    return Napi::Number::New(env, static_cast<double>(pid));
}

Napi::Object process_init(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "createProcess"), Napi::Function::New(env, createProcess));
    return exports;
}
