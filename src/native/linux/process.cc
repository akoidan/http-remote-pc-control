#include <napi.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <vector>
#include <string>
#include <cstring>
#include "./headers/process.h"


std::string get_process_path(pid_t pid, Napi::Env env) {
    if (pid <= 0) {
        throw Napi::Error::New(env, "Invalid pid");
    }

    char path[1024];
    char proc_path[1024];
    snprintf(proc_path, sizeof(proc_path), "/proc/%d/exe", pid);

    ssize_t len = readlink(proc_path, path, sizeof(path) - 1);
    if (len == -1) {
        throw Napi::Error::New(env, "Failed to get process path");
    }
    path[len] = '\0';
    return std::string(path);
}


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

static Napi::Number getProcessMainWindow(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    // Not implemented for Linux in this project; return 0 as a stub
    return Napi::Number::New(env, 0);
}

Napi::Object processInit(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "createProcess"), Napi::Function::New(env, createProcess));
    exports.Set(Napi::String::New(env, "getProcessMainWindow"), Napi::Function::New(env, getProcessMainWindow));
    return exports;
}
