[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/akoidan/http-remote-pc-control/blob/main/LICENSE) [![Coverage](https://coveralls.io/repos/github/akoidan/http-remote-pc-control/badge.svg?branch=main)](https://coveralls.io/github/akoidan/http-remote-pc-control?branch=main) [![Build Status](https://github.com/akoidan/http-remote-pc-control/actions/workflows/release.yaml/badge.svg)](https://github.com/akoidan/http-remote-pc-control/actions/workflows/release.yaml)

# HTTP Remote PC Control
Allows remote control a PC using HTTP API. Events include:
 - Mouse movement and clicks
 - Keyboard events
 - Running executable files or terminating processes
 - Window operations like focus and resize

You can also use [hotkey-hub](https://github.com/akoidan/hotkey-hub) for managing PC via system-wide keyboard shortcuts on a remote PC.

## API Documentation
- Check [GitHub Pages](https://akoidan.github.io/http-remote-pc-control/) for the latest API specification.
- For specific versions, use `openapi.json` from [releases](https://github.com/akoidan/http-remote-pc-control/releases). You can load this file into OpenAPI tools, e.g. [Swagger Editor](https://editor.swagger.io/)

## Get started

### Certificates
The client and server rely on [mutual TLS authentication](https://www.cloudflare.com/learning/access-management/what-is-mutual-tls/).
In order to generate certificate use:

```bash
http-remote-pc-control --generate
```

This will generate `%APPDATA%/http-remote-pc-control/certs`, where `APPDATA` is `~/.config` on linux and `C:\Users\<username>\AppData\Roaming` on Windows:
 - `certs/ca-cert.pem`, `certs/key.pem`, `certs/cert.pem` files that http server will use.
 - `certs/ca/ca-cert.pem` and `certs/ca/ca-key.pem` certificate authority (CA) for further MTLS client generation
 - `certs/client/ca-cert.pem`, `certs/client/key.pem`, `certs/client/cert.pem` files for the http client you can use. Copy them to your client `*`

For further client generation you can use

```bash
http-remote-pc-control --create-client-tls dirName
```

It will output files required clients to connect to `certs/dirName`. 

`*` In ideal scenarios you can use `openssl` for mtls generation so you don't have to copy private keys over network.

### Ubuntu
 - Install dependencies: `sudo apt-get install --no-install-recommends libxcb-ewmh2 libxtst6 libxcb-ewmh2 libxcb1 libdbus-1-3`
 - Download `http-remote-pc-control.deb` from [releases](https://github.com/akoidan/http-remote-pc-control/releases).
 - Install the package: `sudo dpkg -i http-remote-pc-control.deb`
 - Start the service with the same user as the logged-in X session: `systemctl --user start http-remote-pc-control`
 - You will find certificates in `~/.config/http-remote-pc-control/certs`
 - You will find OpenAPI documentation in `/usr/share/http-remote-pc-control/openapi.json`
 - To view logs, run: `journalctl --user -o cat -u http-remote-pc-control -f`

#### Arch Linux
 - Install the package with `yay` or `paru` from AUR: `yay -S http-remote-pc-control`
 - Start the service with the same user as the logged-in X session: `systemctl --user start http-remote-pc-control`
 - You will find certificates in `~/.config/http-remote-pc-control/certs`
 - You will find OpenAPI documentation in `/usr/share/http-remote-pc-control/openapi.json`
 - To view logs, run: `journalctl --user -o cat -u http-remote-pc-control -f`

#### Other Linux Distributions
- You need an X11 server + XCB bindings (libX11, libXext, xcb-util-wm, xorg-setxkbmap)
- Download `http-remote-pc-control.elf` from [releases](https://github.com/akoidan/http-remote-pc-control/releases).
- Ensure the directory with the executable or project directory contains a `certs` directory with certificates
- Run: `chmod +x http-remote-pc-control.elf && ./http-remote-pc-control.elf 5000`
- If you need a systemd unit, check [http-remote-pc-control.service](./packages/http-remote-pc-control.service)

#### Windows
 - Download `http-remote-pc-control.exe` from [releases](https://github.com/akoidan/http-remote-pc-control/releases).
 - If an antivirus deletes the file, you can allow it in **Virus & threat protection** → **Protection History** → Expand the recently blocked threat and allow it.
 - Ensure the directory with the executable or project directory contains a `certs` directory with certificates (see steps above).
 - Run the executable as Administrator.
 - If Windows antivirus complains about security, open **Virus & threat protection** → **Virus & threat protection settings** → **Exclusions** → **Add or remove exclusions** → **Add an exclusion**.
 - If it crashes, open PowerShell and run the executable from it; it's a CLI app.

#### Autostart on Windows
This program must be started as Administrator so it has permission to send keystrokes or move the mouse. Add a script to autostart in Windows with admin permissions. Replace the path with your http-remote-pc-control.exe.
Open admin powerhsell and insert this code (replace according comments)
```ps1
# Replace this path to where exe file is stored
$ProgramPath = "C:\Users\death\Downloads\app.exe"
# Replace this path to where you have cert directory and config directory
$WorkingDir  = "C:\Users\death\Downloads"
$TaskName    = "RemotePcControl"

$Action  = New-ScheduledTaskAction -Execute $ProgramPath -WorkingDirectory $WorkingDir
$Trigger = New-ScheduledTaskTrigger -AtLogOn
$Principal = New-ScheduledTaskPrincipal -UserId "$env:USERNAME" -RunLevel Highest

Register-ScheduledTask -TaskName $TaskName `
    -Action $Action `
    -Trigger $Trigger `
    -Principal $Principal `
    -Force

```

## Client Example
You can call the API programmatically via HTTPS by providing the client private key, CA certificate, and client certificate that was signed with the CA certificate. The server uses a certificate that was also signed by the CA.
You can also find more example on [GitHub Pages](https://akoidan.github.io/http-remote-pc-control/)

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
      'x-request-id': 'r2d2' // unique request ID, can be omitted
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

### NAT
If your current PC doesn't have a static IP or is behind [NAT](https://en.wikipedia.org/wiki/Network_address_translation), you can use a VPN or third-party services like [ngrok](https://ngrok.com/), [localtunnel](https://github.com/localtunnel/localtunnel), or [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) to expose it to the internet. Example with ngrok:
```bash
ngrok http 5000
```

### Help
The app allows minimal configuration. Check the following command for options:
```bash
./http-remote-pc-control --help
```

## Develop Locally
Check [CONTRIBUTING.md](CONTRIBUTING.md)
