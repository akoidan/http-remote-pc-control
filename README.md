# Http Remote PC control
Allows to remotely control this PC using http api. Events like:
 - Mouse move, click
 - Keyboard events
 - Running executabe files or killing executable
 - Operating windows, like focus, resize

You can also use https://github.com/akoidan/hotkey-hub for doing this via system wide keyboard shortcut from a remote PC.

## Get started

### Certificates

Generate certificates with [gen-cert.sh](./gen-cert.sh) for [MTLS](https://www.cloudflare.com/learning/access-management/what-is-mutual-tls/) encryption.

```bash
bash ./gen-cert.sh
```

It will generate:
 - self-sign CA certificate with its private key and put CA cert into both ./certs/ca-cert.pem and ./client/ca-cert.pem
 - server and client private key in the ./certs/key.pem and ./client/key.pem
 - server and client certificate that are signed with CA private key and put it into ./certs/cert.pem and ./client/cert.pem

Leave certs directory in the project or within the same directory you are running app executable file.
Copy client directory to the remote PC where you have the [server](https://github.com/akoidan/hotkey-hub)

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

## Autostart on Windows OS
This program has to be started as Admin so it has permision to send keystrokes or move mouse. Add a script to autostart in Windows with admin petrmissions: Replace path to your app.exe:
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

### Clion
If you want to debug native code, you need to build native module in a debug mode, `yarn build:local` already does it. Then you can attach to the nodejs process via gdb from Clion which should pull sourcemaps and allow to put breakpoints in native code. In order to start the process, you can still use `yarn start`, as soon as native module loads it will pull the breakpoints from IDE.

In order to have proper syntax highlight from nodejs headers, you have to manually add them to Clion configs:

Open Settings -> Cmake -> Add configuration

Add Cmake options:
```
 -DCMAKE_CXX_FLAGS="-I/home/andrew/.nvm/versions/node/v18.18.2/include/node -I/home/andrew/it/my-projects/http-remote-pc-control/node_modules/node-addon-api"
```
Replace **/home/andrew/** to your home directory. Do not use `~` alias, should be absolute path.
