# l2
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
 - server and client certificate that is signed with CA private key and put it into  ./server/certs/cert.pem and ./server/certs/cert.pem

**If you don't care about security** you can grab certificates directories from [poc/mtls/client](/pocs/mtls/client/certs) and [poc/mtls/server](/pocs/mtls/server/certs).

### Client
 - Download client you want to receive shorcuts [releases](https://github.com/akoidan/l2/releases)
 - Copy ./client/certs directory into a current directory. So pwd contains `certs` directory
 - Run exe files as Administrator. If Windows antivirus complains about it, add it to exceptions. If it crashes run it from cmd to get the stdout 
 
### Server
 - Download server you want to send shortcuts [releases](https://github.com/akoidan/l2/releases)
 - Unpack archive
 - Create a config file inside **/resources/app/src/config/config.jsonc**. You can find examples [here](server/src/config/examples)
 - Copy ./server/certs directory into a current directory. So pwd contains `certs` directory
 - run **l2.exe** as regular user. If it crasher, run it from cmd to get output

## Security
The client server app uses JWT authorization. Clients verify that requests were signed with matched private key to a hardcoded matched public key in the client exe bytecode.
Keys are generated and located here:
- openssl genpkey -algorithm RSA -out [private_key.pem](./server/src/client/private_key.pem)
- openssl rsa -pubout -in private_key.pem -out [public_key.pem](client/src/mtls/public_key.pem)

You can replace the key when you build the client app.
Client apps should be available withing the address provided in config. So either all apps are within same network. Or clients have public static IP address.

## Config structure
- ips: a map of a name and ip address of the remote PC.
- aliases: a map with an alias and a corresponding name of the remote PC (from ips)
- delay: global delay between multiple commands in receiver section
- combinations: binding o


## OS support
- Windows
- Linux
- Mac

This product has 2 apps: Client and Server. Client app is built via [pkg](https://www.npmjs.com/package/pkg) and server app is built via [electron](https://www.npmjs.com/package/electron). Electron has proper binary implementation that can capture global keystroke even if a game is active in full screen mode, while pkg provides an easy manipulation withing the keyboard and mouse and lightweight binary. Both packages support Window/Linux/Mac.

## Autostart
Add a script to autostart in Windows with admin permissions: Replace path to your app.exe:
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

## Build manually

### Remote PC
To build the client you need [nvm](https://github.com/nvm-sh/nvm) and [yarn](https://yarnpkg.com/) installed.
```bash
cd client
nvm use
yarn 
yarn build
```
You'll get app.exe in client directory. Put it into remote PCs and run with admin permissions. For different OS  use `yarn pkg . --targets linux --output app.exe`. All targets are listed [here](https://www.npmjs.com/package/pkg#targets)


### Local PC

Copy an example config and fill it with your data.
```bash
cp ./server/src/config/examples/config-ss-2.jsonc ./server/src/config/config.jsonc
```

You'll have to define ip address of the receiver and configure aliases and combinations.  
Run the server. You need [nvm](https://github.com/nvm-sh/nvm) and [yarn](https://yarnpkg.com/) installed.
```bash
cd server
nvm use
yarn
yarn start
```

WHen you hit the shortcut on your local PC, the remote PC will receive a keyStroke.


