#include <napi.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <vector>
#include <string>
#include <cstring>
#include <fstream>
#include <sstream>
#include "./headers/process.h"
#include "./headers/validators.h"


std::string getProcessPath(pid_t pid, Napi::Env env) {
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

static Napi::Boolean isProcessElevated(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    // Check if running as root (UID == 0)
    return Napi::Boolean::New(env, getuid() == 0);
}

static Napi::Object getProcessInfo(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    GET_UINT_32(info, 0, pid, pid_t);
    
    if (pid <= 0) {
        throw Napi::Error::New(env, "Invalid pid");
    }
    
    Napi::Object result = Napi::Object::New(env);
    
    // Get process path
    std::string path = getProcessPath(pid, env);
    result.Set("path", Napi::String::New(env, path));
    
    // Get basic info from /proc/[pid]/stat
    char stat_path[1024];
    snprintf(stat_path, sizeof(stat_path), "/proc/%d/stat", pid);
    
    std::ifstream stat_file(stat_path);
    if (!stat_file.is_open()) {
        throw Napi::Error::New(env, "Failed to open process stat file");
    }
    
    std::string stat_line;
    std::getline(stat_file, stat_line);
    std::istringstream stat_stream(stat_line);
    
    std::string token;
    // Skip first token (comm)
    stat_stream >> token;
    
    // Parse stat fields
    char state;
    long ppid;
    stat_stream >> state >> ppid;
    
    // Skip to utime, stime, cutime, cstime (fields 14-17)
    for (int i = 4; i < 14; ++i) stat_stream >> token;
    
    unsigned long utime, stime, cutime, cstime;
    stat_stream >> utime >> stime >> cutime >> cstime;
    
    // Get memory info from /proc/[pid]/status
    char status_path[1024];
    snprintf(status_path, sizeof(status_path), "/proc/%d/status", pid);
    
    std::ifstream status_file(status_path);
    unsigned long memory_usage = 0;
    int thread_count = 0;
    
    if (status_file.is_open()) {
        std::string line;
        while (std::getline(status_file, line)) {
            if (line.substr(0, 6) == "VmRSS:") {
                std::istringstream iss(line);
                std::string label;
                iss >> label >> memory_usage; // in KB
            } else if (line.substr(0, 8) == "Threads:") {
                std::istringstream iss(line);
                std::string label;
                iss >> label >> thread_count;
            }
        }
    }
    
    // Set result properties
    result.Set("pid", Napi::Number::New(env, pid));
    result.Set("parentPid", Napi::Number::New(env, ppid));
    result.Set("threadCount", Napi::Number::New(env, thread_count));
    
    // Memory object
    Napi::Object memory = Napi::Object::New(env);
    memory.Set("workingSetSize", Napi::Number::New(env, static_cast<double>(memory_usage * 1024))); // Convert KB to bytes
    memory.Set("peakWorkingSetSize", Napi::Number::New(env, static_cast<double>(memory_usage * 1024)));
    memory.Set("privateUsage", Napi::Number::New(env, static_cast<double>(memory_usage * 1024)));
    memory.Set("pageFileUsage", Napi::Number::New(env, static_cast<double>(memory_usage * 1024))); // Use RSS as approximation
    result.Set("memory", memory);
    
    // Times object (convert clock ticks to milliseconds)
    long clock_ticks_per_sec = sysconf(_SC_CLK_TCK);
    Napi::Object times = Napi::Object::New(env);
    times.Set("creationTime", Napi::Number::New(env, 0.0)); // Not easily available
    times.Set("kernelTime", Napi::Number::New(env, static_cast<double>(stime * 1000 / clock_ticks_per_sec)));
    times.Set("userTime", Napi::Number::New(env, static_cast<double>(utime * 1000 / clock_ticks_per_sec)));
    result.Set("times", times);
    
    // Check if process is elevated (same as current process)
    result.Set("isElevated", isProcessElevated(info));
    
    return result;
}

Napi::Object processInit(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "createProcess"), Napi::Function::New(env, createProcess));
    exports.Set(Napi::String::New(env, "getProcessMainWindow"), Napi::Function::New(env, getProcessMainWindow));
    exports.Set(Napi::String::New(env, "isProcessElevated"), Napi::Function::New(env, isProcessElevated));
    exports.Set(Napi::String::New(env, "getProcessInfo"), Napi::Function::New(env, getProcessInfo));
    return exports;
}
