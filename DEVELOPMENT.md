## Develop locally

### Requirements:
You need cmake, yarn, node version 18 or nvm, and a proper C/C++ compiler toolchain of the given platform

#### Windows
- [Visual C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/). If you installed nodejs with the installer, you can install these when prompted.
- An alternate way is to install the [Chocolatey package manager](https://chocolatey.org/install), and run `choco install visualstudio2017-workload-vctools` in an Administrator Powershell
- If you have multiple versions installed, you can select a specific version with `npm config set msvs_version 2017` (Note: this will also affect `node-gyp`)
- [cmake](https://cmake.org/download/),
- Node version 18 or [nvm](https://github.com/nvm-sh/nvm)
- [yarn](https://yarnpkg.com/).
#### Unix/Posix
- Clang or GCC
- Ninja or Make (Ninja will be picked if both present)
- Node version 18 or [nvm](https://github.com/nvm-sh/nvm)
- [yarn](https://yarnpkg.com/).
#### MacOS
- brew install cmake nvm yarn
#### ArchLinux:
- sudo pacman -S xcb-util-wm nvm yarn cmake g++

### Run in dev mode

To build the client you need

```sh
nvm use 18 # If you already have node 18, skip it
yarn # install depenencies
yarn build:local # builds native c++ modules 
yarn start # starts a nestjs server 
```

### Debugging Native Code with CLion

If you want to debug native Node.js modules in **CLion**, you need to build the module in **Debug mode**.

#### 1. Build the Native Module
Run:
```bash
yarn build:local
```  
This command already builds the native module in Debug mode.

#### 2. Start and Attach the Debugger
- Start your app with:
  ```bash
  yarn start
  ```  
- Once the native module loads, attach CLion’s debugger (`gdb`) to the running Node.js process.
- CLion will automatically pull sourcemaps, allowing you to place breakpoints in native C++ code.

#### 3. Enable Syntax Highlighting for Node.js Headers
CLion does not automatically pick up Node.js and N-API headers. You must add them manually:

**Steps:**
1. Go to **Settings → Build, Execution, Deployment → CMake**.
2. Add a new configuration.
3. Add the following to **CMake options** (adjust paths for your system).

##### Arch Linux example
```cmake
-DCMAKE_CXX_FLAGS="-I/home/andrew/.nvm/versions/node/v18.18.2/include/node -I/home/andrew/it/my-projects/http-remote-pc-control/node_modules/node-addon-api"
```

##### Windows example
```cmake
-DCMAKE_CXX_FLAGS="-IC:\Users\death\.cmake-js\node-x64\v18.20.5\include\node -IC:\Users\death\WebstormProjects\http-remote-pc-control\node_modules\node-addon-api"
```

#### 4. Required Directories
You need to provide **two include directories**:

- **Node.js headers**
    - Example: `.../include/node`
    - Contains `node.h`, `node_api.h`, etc.
    - If missing, run:
      ```bash
      npx cmake-js print-cmakejs-src
      ```  

- **N-API headers**
    - Example: `.../node_modules/node-addon-api`
    - Contains `napi.h` and related files.  