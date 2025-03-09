**Requirements:**

- [CMake](http://www.cmake.org/download/)
- A proper C/C++ compiler toolchain of the given platform
  - **Windows**:
    - [Visual C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/). If you installed nodejs with the installer, you can install these when prompted.
    - An alternate way is to install the [Chocolatey package manager](https://chocolatey.org/install), and run `choco install visualstudio2017-workload-vctools` in an Administrator Powershell
    - If you have multiple versions installed, you can select a specific version with `npm config set msvs_version 2017` (Note: this will also affect `node-gyp`)
  - **Unix/Posix**:
    - Clang or GCC
    - Ninja or Make (Ninja will be picked if both present)
  - **MacOs**:  
    - brew install cmake

  
# Runtime
- **ArchLinux**:
  - sudo pacman -S xcb-util-wm  

# Clion
Open Settings -> Cmake -> Add configuration

Add Cmake options:
```
 -DCMAKE_CXX_FLAGS="-I/home/andrew/.nvm/versions/node/v18.18.2/include/node -I/home/andrew/it/my-projects/l2/client/node_modules/node-addon-api"
```
Replace **/home/andrew/** to your home directory. Do not use `~` alias, should be absolute path.


# Local

```sh
nvm use 18
yarn
yarn build:local
yarn start
```

x