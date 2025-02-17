# Hotkey Hub
Easy remote PC control via local shorcuts
E.g. you press `alt+1` on your PC and remote one send a keyStroke `F1`.


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

**If you don't care about security** you can grab certificates directories from [poc/mtls/client](/pocs/mtls/client/certs) and [poc/mtls/server](/pocs/mtls/server/certs).

### Config
Create a config mapper file in the PC that you want to controll other PCs from. We call it server (see [Server](#server)) .The file should be named as **configs/config.jsonc** ans be with the same directory as server app.exe. You can get examples of config files [examples](./examples) and documentation [here](./server/README.md#root). 

Also you can find json schema here [json-schema.json](server/json-schema.json). You can use any editor that support json schema. E.g. [jsonschemavalidator.net](https://www.jsonschemavalidator.net/). Just paste the content from [json-schema.json](server/json-schema.json) into the left panel of it, and you can write your config in the right panel. After it as I mentioned above put it into **config.jsonc** with the same directory you have you app.exe for the server.

### Client
 - Download client you want to receive shorcuts [releases](https://github.com/akoidan/l2/releases).
 - If windows antivirus deletes a file, you can allow it in **Virus & threat protection** -> **Protection History** -> Expaned recently blocked threat and allow it
 - Copy ./client/certs directory into a current directory. So pwd contains `certs` directory
 - Run exe files as Administrator. 
 - If windows antivirus complains about security Open **Virus & threat protection** -> **Virus & threat protection settings** -> **Exclusions Add or remove exclusions** -> **Add an exclusion**. 
 - If it crashes , open powershell and run exe file from it, it's a CLI app.
 
### Server
 - Download server you want to send shortcuts [releases](https://github.com/akoidan/l2/releases)
 - You already have your configs/config.jsonc described in [config](#config)
 - Put server sertificate into `certs` directory which is in the same directory as app.exe
 - run **app.exe** as regular user.
 - If it crasher, run it from cmd to get output

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

### Client PC
To build the client you need [nvm](https://github.com/nvm-sh/nvm), [yarn](https://yarnpkg.com/), [cmake](https://cmake.org/download/), [g++](https://visualstudio.microsoft.com/ru/visual-cpp-build-tools/)
```bash
cd client
nvm use
yarn
yarn build:local
yarn start
```
You'll get app.exe in client directory. Put it into remote PCs and run with admin permissions. For different OS  use `yarn pkg . --targets linux --output app.exe`. All targets are listed [here](https://www.npmjs.com/package/pkg#targets)


### Server PC

Copy an example config and fill it with your data.
```bash
cp ./server/examples/config/tyrs.jsonc ./server/config/config.jsonc
```

You'll have to define ip address of the receiver and configure aliases and combinations.  
Run the server. You need [nvm](https://github.com/nvm-sh/nvm) and [yarn](https://yarnpkg.com/) installed.
```bash
cd server
nvm use
yarn
yarn build:local
yarn start
```

WHen you hit the shortcut on your local PC, the remote PC will receive a keyStroke.


