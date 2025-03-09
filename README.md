# Http Remote PC control
Allows to remotely control this PC using http api. Events like:
 - Mouse move, click
 - Running executabe files or killing executable
 - Operating windows, like focus, resize


## Get started

### Certificates

Generate certificates with [gen-cert.sh](./gen-cert.sh) for [MTLS](https://www.cloudflare.com/learning/access-management/what-is-mutual-tls/) encryption.

```bash
bash ./gen-cert.sh
```

It will generate:
 - self-sign CA certificate with its private key and put CA cert into both ./server/certs/ca-cert.pem and ./client/certs/ca-cert.pem
 - server and client private key in the ./server/certs/key.pem and ./client/certs/key.pem
 - server and client certificate thatis signed with CA private key and put it into  ./server/certs/cert.pem and ./server/certs/cert.pem

### Download the app
 - Download client you want to receive shorcuts [releases](https://github.com/akoidan/http-remote-pc-control/releases).
 - If windows antivirus deletes a file, you can allow it in **Virus & threat protection** -> **Protection History** -> Expaned recently blocked threat and allow it
 - Copy ./client/certs directory into a current directory. So pwd contains `certs` directory
 - Run exe files as Administrator. 
 - If windows antivirus complains about security Open **Virus & threat protection** -> **Virus & threat protection settings** -> **Exclusions Add or remove exclusions** -> **Add an exclusion**. 
 - If it crashes , open powershell and run exe file from it, it's a CLI app.


## Security
The client server app both use mutual TLS authentication. 
Client apps should be available withing the address provided in config. So either all apps are within same network. Or clients have public static IP address.

## OS support
- Windows
- Linux
- Mac is coming...

This product has 2 apps: Client and Server. Native binaries are shipped via [pkg](https://www.npmjs.com/package/pkg) that packs Nodejs inside of the executable. Both apps support Window/Linux and Mac support is coming soon

## Autostart
Add a script to autostart in Windows with admin petrmissions: Replace path to your app.exe:
```shell
@echo off
setlocal

:: Replace with the path to your program
set "ProgramPath=C:\Users\msi\Downloads\app.exe"
set "ProgramName=L2"

:: Create the task in Task Scheduler for admin startup
schtasks /create /tn "%ProgramName%" /tr "\"%ProgramPath%\"" /sc onlogon /rl highest /f

if %errorlevel% equ 0 (
echo Program added to startup with admin permissions successfully.
) else (
echo Failed to add program to startup.
)

pause
```

## Develop locally

### Requirements:

- [CMake](http://www.cmake.org/download/)
- A proper C/C++ compiler toolchain of the given platform
  - **Windows**:
    - [Visual C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/). If you installed nodejs with the installer, you can install these when prompted.
    - An alternate way is to install the [Chocolatey package manager](https://chocolatey.org/install), and run `choco install visualstudio2017-workload-vctools` in an Administrator Powershell
    - If you have multiple versions installed, you can select a specific version with `npm config set msvs_version 2017` (Note: this will also affect `node-gyp`)
    - [cmake](https://cmake.org/download/),
    - Node version 18 or [nvm](https://github.com/nvm-sh/nvm) 
    - [yarn](https://yarnpkg.com/). 
  - **Unix/Posix**:
    - Clang or GCC
    - Ninja or Make (Ninja will be picked if both present)
  - **MacOs**:  
    - brew install cmake
  - **ArchLinux**:
    - sudo pacman -S xcb-util-wm nvm yarn cmake g++

### Run in dev mode

To build the client you need

```sh
nvm use 18 # If you already have node 18, skip it
yarn # install depenencies
yarn build:local # builds native c++ modules 
yarn start # starts a nestjs server 
```

### Clion
Open Settings -> Cmake -> Add configuration

Add Cmake options:
```
 -DCMAKE_CXX_FLAGS="-I/home/andrew/.nvm/versions/node/v18.18.2/include/node -I/home/andrew/it/my-projects/http-remote-pc-control/node_modules/node-addon-api"
```
Replace **/home/andrew/** to your home directory. Do not use `~` alias, should be absolute path.
