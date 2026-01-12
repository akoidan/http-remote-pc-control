# Http Remote PC control
Allows to remotely control this PC using http api. Events like:
 - Mouse move, click
 - Keyboard events
 - Running executabe files or killing executable
 - Operating windows, like focus, resize

You can also use [hotkey-hub](https://github.com/akoidan/hotkey-hub) for managing PC via system wide keyboard shortcut on a remote PC.

## Get started

### Certificates
The client server app both rely on [mutual TLS authentication](https://www.cloudflare.com/learning/access-management/what-is-mutual-tls/).
If you use a package (Ubuntu/Debian/Archlinux) the service will generate certificates for you. No actions are required. For Windows or other Linux distros you can use my helper script to generate certificates with [gen-cert.sh](./gen-cert.sh). Download it and run it with bash.

```bash
bash ./gen-cert.sh all
```
Note that on Windows you need bash, you can either use [git bash](https://git-scm.com/install/windows) or [WSL](https://learn.microsoft.com/en-us/windows/wsl/install)

You have to:
- Copy ./gencert/server into ./certs directory where app executable is
- Copy ./gencert/client into ./certs on the remote PC from where you use the api. The client PC should not validate domain name.

### Ubuntu
 - Install dependencies `sudo apt-get install libxcb-ewmh2 libxtst6 libxcb-ewmh2 libxcb1 libdbus-1-3` if you dont have them yet 
 - Download `http-remote-pc-control.deb` from [releases](https://github.com/akoidan/http-remote-pc-control/releases).
 - Install the package `sudo dpkg -i http-remote-pc-control.deb`
 - Start the service with the same user as logged in X `systemctl --user start http-remote-pc-control`
 - You will find certificates in `~/.local/share/http-remote-pc-control/certs`
 - You will openapi documentation in  `/usr/share/http-remote-pc-control/swagger.json`
 - To view logs check `journalctl --user -o cat -u http-remote-pc-control -f`

#### Archlinux
 - Install the package with `yay` or `paru` from AUR `yay -S http-remote-pc-control`
 - Start the service with the same user as logged in X `systemctl --user start http-remote-pc-control`
 - You will find certificates in `~/.local/share/http-remote-pc-control/certs`
 - You will openapi documentation in  `/usr/share/http-remote-pc-control/swagger.json`
 - To view logs check `journalctl --user -o cat -u http-remote-pc-control -f`

#### Other Linux distro
- You need X11 server + XC Binding  (libX11, libXext, xcb-util-wm, xorg-setxkbmap)
- Download `http-remote-pc-control.elf` from [releases](https://github.com/akoidan/http-remote-pc-control/releases).
- Ensure directory with the executalbe, or project direcotry contains `certs` directory with certificates
- run `chmod +x http-remote-pc-control.elf && ./http-remote-pc-control.elf 5000`
- If you need systemd unit, check [http-remote-pc-control.service](./packages/http-remote-pc-control.service)

#### Windows
 - Download `http-remote-pc-control.exe` from [releases](https://github.com/akoidan/http-remote-pc-control/releases).
 - If Antivirus deletes a file, you can allow it in **Virus & threat protection** -> **Protection History** -> Expaned recently blocked threat and allow it
 - Ensure directory with the executalbe, or project direcotry contains `certs` directory with certificates (check step above)
 - Run exe files as Administrator. 
 - If windows antivirus complains about security Open **Virus & threat protection** -> **Virus & threat protection settings** -> **Exclusions Add or remove exclusions** -> **Add an exclusion**. 
 - If it crashes, open powershell and run exe file from it, it's a CLI app.

#### Autostart on Windows OS
This program has to be started as Admin so it has permision to send keystrokes or move mouse. Add a script to autostart in Windows with admin petrmissions: Replace path to your http-remote-pc-control.exe:
```shell
@echo off
setlocal

:: Replace with the path to your program
set "ProgramPath=C:\Users\msi\Downloads\http-remote-pc-control.exe"
set "ProgramName=RemotePcControl"

:: Create the task in Task Scheduler for admin startup
schtasks /create /tn "%ProgramName%" /tr "\"%ProgramPath%\"" /sc onlogon /rl highest /f

if %errorlevel% equ 0 (
echo Program added to startup with admin permissions successfully.
) else (
echo Failed to add program to startup.
)

pause
```

## Client example
You can call the api programmaticaly via https my providing client private key, CA certificate and client certificate that was signed with CA certificate. Server uses certificate that was also signed by CA

```typescript
import {
  Agent,
  request,
} from 'https';
import { readFile } from 'fs/promises';

(async function main() {
  let data = '';
  const req = request({
    agent: new Agent({
      cert: await readFile('./gencert/client/cert.pem', 'utf8'),
      key: await readFile('./gencert/client/key.pem', 'utf8'),
      ca: await readFile('./gencert/client/ca-cert.pem', 'utf8'),
      rejectUnauthorized: true, // force to fail upon wrong public keys
      checkServerIdentity: () => undefined, // we don't care about domain name, since we rely on PK in mtls
    }),
    port: 5000,
    host: 'localhost', // replace with remote IP
    protocol: 'https:',
    path: '/app/ping',
    method: 'GET',
    header: {
      'x-request-id': 'r2d2' // unique request id, can be ommited
    },
  }, (res) => {
    let data = '';
    res.on('data', (chunk: string) => (data += chunk));
    res.on('end', () => {
      if (res.statusCode! < 400) {
        console.debug('.');
      } else {
        console.log(data)
      }
    });
    res.on('error', (error: Error) => console.error(error));
  });
})()
```

### Api documentation
You can find openapi documentation at `swagger.json` under [releases](https://github.com/akoidan/http-remote-pc-control/releases).
You can put this file into any swagger ui, e.g. [Swagger Editor](https://editor.swagger.io/)

### NAT
If your current PC doesn't have a static IP or under [NAT](https://en.wikipedia.org/wiki/Network_address_translation), you can use VPN or some 3rd party service like [ngrok](https://ngrok.com/) [localtunel](https://github.com/localtunnel/localtunnel) or [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) to expose it to the world. Example with ngrock:
```bash
ngrok http 5000
```

### Help
App allows minimal configuration, check the following command for options
```bash
./http-remote-pc-control --help
```

## Develop locally
Check [DEVELOPMENT.md](DEVELOPMENT.md)
