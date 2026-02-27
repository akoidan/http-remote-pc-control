# Contributing

Thank you for your interest in contributing! This guide will help you set up your development environment and understand the contribution process.

## Prerequisites:
You need CMake, Yarn, Node.js version 24 (or nvm), and a proper C/C++ compiler toolchain for your platform.

## Windows
- [Visual C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/). If you installed Node.js with the installer, you can install these when prompted.
- An alternate way is to install the [Chocolatey package manager](https://chocolatey.org/install) and run `choco install visualstudio2017-workload-vctools` in an Administrator PowerShell
- If you have multiple versions installed, you can select a specific version with `npm config set msvs_version 2017` (Note: this will also affect `node-gyp`)
- [CMake](https://cmake.org/download/)
- Node.js version 24 or [nvm](https://github.com/nvm-sh/nvm)
- [Yarn](https://yarnpkg.com/)

## Linux
- GCC
- Ninja or Make (Ninja will be picked if both present)
- X11 or Wayland with X11 libs api.
- Node.js version 24 or [nvm](https://github.com/nvm-sh/nvm)
- [Yarn](https://yarnpkg.com/)

### Arch Linux
```bash
sudo pacman -S xcb-util-wm nvm yarn cmake g++
```
### Ubuntu

```bash
apt-get install libx11-dev libxtst-dev libxcb-ewmh-dev libxcb1-dev cmake g++ make
```
## Apple

- Clang
- Ninja or Make (Ninja will be picked if both present)
- Node.js version 24 or [nvm](https://github.com/nvm-sh/nvm)
- [Yarn](https://yarnpkg.com/)

```bash
brew install cmake nvm yarn
```

## Run in dev mode

To build the client you need

```sh
nvm use 24 # If you already have node 24, skip it. Also do not use node 25, it has broken SEA
yarn # install dependencies
yarn cmake # builds native c++ modules 
yarn start # starts a nestjs server 
```

## Debugging Native .cc files

If you want to debug native Node.js modules you need to build the module in **Debug mode**.

## 1. Build the Native Module
Run:
```bash
yarn cmake:debug
```  
This command already builds the native module in Debug mode.

## 2. Start and Attach the Debugger
- Start your app with:
  ```bash
  yarn start
  ```
- Attach to a remote process using your favorite (c++) IDE debugger, see the IDE options below

## IDE

### CLION
For .cc (c++) you can use CLion for syntaxt support and debugging. However Clion debugger would only work on Linux. On **windows CLion  debugger won't work**, since CLion cannot properly work with `cl.exe` windows compiler, which emits source info to a different file. You can still use Clion for syntaxt higlight on windows thought .

**Steps:**
1. Go to **Settings → Build, Execution, Deployment → CMake**.
2. Add a new configuration.
3. Toolchain: Use VisualStudio for Windows and gcc for Linux
4. Generator: Select ninja generator
5. Build directory: Select `build`
6. CMake options: Add the following options (change the path to project path). It should be absolute path.

```cmake
-DCMAKE_CXX_FLAGS="-IC:\hotkey-hub\node_modules\node-api-headers\include -IC:\hotkey-hub\node_modules\node-addon-api"
```
For debugging do
- Launch nodejs process
- Run (from top menu) -> Attach to process ->  Find nodejs process here

Note it should be nodejs process, not the parent yarn process that started nodejs


### Visual Studio

Don't confuse it with VSCode, Visual Studio is required to syntaxt highlight debug .cc (c++) files
In order to generate VisualStudio project do:
```ps1
yarn clean
yarn cmake-js configure -G "Visual Studio 17 2022"
```

Open `build`  directory in Visual Studio as a project.
You should be able to modify file and get proper syntaxt highlight.

For debugging do
- Launch nodejs process. E.g. `yarn start`
- Debugging (from top menu) -> Attach to process ->  Find nodejs process here. E.g. filter all process by `node` and find `node -r tsconfig-paths/register -r ts-node/register src/main.ts`.

### Webstorm/VSCode

The use is straightforward, typecript language service should automatically pull all .ts file info and syntaxt highlight.

Note it should be nodejs process, not the parent yarn process that started nodejs

## Testing
There are Node.js tests only in this project.

```bash
yarn test
```