# Http Remote PC control
Allows to remotely control this PC using http api. Events like:
 - Mouse move, click
 - Keyboard events
 - Running executabe files or killing executable
 - Operating windows, like focus, resize

You can also use https://github.com/akoidan/hotkey-hub for doing this via system wide keyboard shortcut from a remote PC.

## Get started

### Certificates
The client server app both use [mutual TLS authentication](https://www.cloudflare.com/learning/access-management/what-is-mutual-tls/).
You can use my helper script to generate certificates with [gen-cert.sh](./gen-cert.sh).

```bash
bash ./gen-cert.sh
```

It will generate:
 - CA PK in  ./gencert/ca/ca-cert.pem
 - CA-cert, client certificate and client PK in ./gencert/client
 - CA-cert, server certificate and server PK in ./gencert/server

You have to:
 - Copy ./gencert/server into ./certs directory where app executable is
 - Copy ./gencert/client into ./certs on the remote PC where you have the [server](https://github.com/akoidan/hotkey-hub)

### Download the app
Here are instructions for windows, for linux you can just ignore windows specific intructions.

#### Linux
 - You need X11 server + XC Binding  (libX11, libXext, xcb-util-wm, xorg-setxkbmap)
 - Download app.elf from [releases](https://github.com/akoidan/http-remote-pc-control/releases).
 - Ensure directory with the executalbe, or project direcotry contains `certs` directory with certificates
 - run `chmod +x app.elf && ./app.elf 5000`
 - If you need autostart check systemd unit for archlinux example https://aur.archlinux.org/cgit/aur.git/snapshot/http-remote-pc-control-git.tar.gz

#### Archlinux
 - `yay -S http-remote-pc-control`
 - `systemctl --user start http-remote-pc-control` withing the same user as logged in X
 - You will find certificates in `~/.local/share/http-remote-pc-control/certs`
 - You will swagger documentation in  `/usr/share/http-remote-pc-control/swagger.json`

#### Windows
 - Download client you want to receive shorcuts [releases](https://github.com/akoidan/http-remote-pc-control/releases).
 - If Antivirus deletes a file, you can allow it in **Virus & threat protection** -> **Protection History** -> Expaned recently blocked threat and allow it
 - Ensure directory with the executalbe, or project direcotry contains `certs` directory with certificates
 - Run exe files as Administrator. 
 - If windows antivirus complains about security Open **Virus & threat protection** -> **Virus & threat protection settings** -> **Exclusions Add or remove exclusions** -> **Add an exclusion**. 
 - If it crashes , open powershell and run exe file from it, it's a CLI app.

#### Autostart on Windows OS
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

### Api documentation
You can find api documentation under [releases](https://github.com/akoidan/http-remote-pc-control/releases). You can put this file into any swagger ui, e.g. [Swagger Editor](https://editor.swagger.io/). This file can be generated locally with
```bash
yarn schema:swagger
```

This will create ./swagger.json in the project directory.

### NAT
If your current PC doesn't have a static IP or under NAT, you can use VPN or some 3rd party service like [ngrok](https://ngrok.com/) [localtunel](https://github.com/localtunnel/localtunnel) or [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) to expose it to the world. Example with ngrock:
```bash
ngrok http 5000
```

### Help
App allows minimal configuration, check the following command for options
```bash
./app.exe --help
```


## Develop locally
Check [DEVELOPMENT.md](DEVELOPMENT.md)
