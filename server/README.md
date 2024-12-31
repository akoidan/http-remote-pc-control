# Schema for config.jsonc

## AARoot

_Object containing the following properties:_

| Property                | Description                                                                                                                                                                                                     | Type                                                                             |
| :---------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------- |
| **`ips`** (\*)          | Definition of remote PCs where keys are PC names and values are their IP addresses. The IP address should be available to a remote PC. You can also use https://ngrok.com/ to get public address or create VPN  | _Object with dynamic keys of type_ `string` _and values of type_ `string` (_IP_) |
| `aliases`               | A map for extra layer above destination property. E.g. you can define PC name in IPS section and instead of specifying PC name directly you can use aliases from this section that points to the PC name.       | `Record<string, Array<string> \| string>`                                        |
| **`delay`** (\*)        | Global delay in miliseconds between commands in order to prevent spam. Could be set to 0                                                                                                                        | `number`                                                                         |
| **`combinations`** (\*) | Shorcuts mappings. Main logic                                                                                                                                                                                   | _Array of [ShortCutMapping](#shortcutmapping) items_                             |
| `macros`                | A map of macros where a key is the macro name and value is its body                                                                                                                                             | _Object with dynamic keys of type_ `string` _and values of type_ [Macro](#macro) |

_(\*) Required._

## CommandOrMacro

A remote command or a macro name

_Union of the following possible types:_

- [Command](#command)
- [RunMacroCommand](#runmacrocommand)

## Command

A remote command

_Union of the following possible types:_

- [KeyPressCommand](#keypresscommand)
- [MouseClickCommand](#mouseclickcommand)
- [LaunchExeCommand](#launchexecommand)
- [TypeTextCommand](#typetextcommand)
- [KillExeCommand](#killexecommand)

## KeyPressCommand

Sends a keyPress to a remote PC.

_Object containing the following properties:_

| Property               | Description                                                   | Type                                                                                                                                                                         |
| :--------------------- | :------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`keySend`** (\*)     | A key to be sent.                                             | `'a' \| 'b' \| 'c' \| 'd' \| 'e' \| 'f' \| 'g' \| 'h' \| 'i' \| 'j' \| 'k' \| 'l' \| 'm' \| 'n' \| 'o' \| 'p' \| 'q' \| 'r' \| 's' \| 't' \| ...` _or_ [Variable](#variable) |
| **`destination`** (\*) | Remote PC from ips or aliases section to send this command to | `string` _or_ [Variable](#variable)                                                                                                                                          |
| `delay`                | Delay in milliseconds before the next command.                | `number` _or_ [Variable](#variable)                                                                                                                                          |

_(\*) Required._

## KillExeCommand

Kills a process on the remote PC.

_Object containing the following properties:_

| Property               | Description                                                   | Type                                |
| :--------------------- | :------------------------------------------------------------ | :---------------------------------- |
| **`kill`** (\*)        | Executable file name. E.g. Chrome.exe                         | `string`                            |
| **`destination`** (\*) | Remote PC from ips or aliases section to send this command to | `string` _or_ [Variable](#variable) |
| `delay`                | Delay in milliseconds before the next command.                | `number` _or_ [Variable](#variable) |

_(\*) Required._

## LaunchExeCommand

Starts a program on a remote PC.

_Object containing the following properties:_

| Property               | Description                                                   | Type                                |
| :--------------------- | :------------------------------------------------------------ | :---------------------------------- |
| **`launch`** (\*)      | Full path to an executable.                                   | `string`                            |
| **`destination`** (\*) | Remote PC from ips or aliases section to send this command to | `string` _or_ [Variable](#variable) |
| `delay`                | Delay in milliseconds before the next command.                | `number` _or_ [Variable](#variable) |

_(\*) Required._

## Macro

A macro that can be injected instead of command. That will run commands from its body. Can be also injected with variables. Think of it like a function

_Object containing the following properties:_

| Property            | Description                                                                                                                                                      | Type                                 |
| :------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------- |
| **`commands`** (\*) | Set of commands for this macro                                                                                                                                   | _Array of [Command](#command) items_ |
| `variables`         | Variables that are used in macros. If you set a option value to {{varName}} in this macro section. If this varName is present in this array, it will be replaced | `Array<string>`                      |

_(\*) Required._

## MouseClickCommand

Moves mouse to specified coordinates and clicks with left button

_Object containing the following properties:_

| Property               | Description                                                   | Type                                |
| :--------------------- | :------------------------------------------------------------ | :---------------------------------- |
| **`mouseMoveX`** (\*)  | X coordinate                                                  | `number` _or_ [Variable](#variable) |
| **`mouseMoveY`** (\*)  | Y coordinate                                                  | `number` _or_ [Variable](#variable) |
| **`destination`** (\*) | Remote PC from ips or aliases section to send this command to | `string` _or_ [Variable](#variable) |
| `delay`                | Delay in milliseconds before the next command.                | `number` _or_ [Variable](#variable) |

_(\*) Required._

## ReceiversAndMacrosArray

A set of events that executed sequentially in this thread

_Array of [CommandOrMacro](#commandormacro) items._

## RunMacroCommand

Runs a macro from the macros section.

_Object containing the following properties:_

| Property         | Description                                        | Type                                |
| :--------------- | :------------------------------------------------- | :---------------------------------- |
| **`macro`** (\*) | Name of the macro (key from macros section object) | `string`                            |
| `variables`      | Object of a key-values of variable name and value  | `Record<string, string \| number>`  |
| `delay`          | Delay in milliseconds before the next command.     | `number` _or_ [Variable](#variable) |

_(\*) Required._

## ShortCutMapping

An event schema that represent a set of commands that is executed when a cirtain shortkey is pressed

_Object containing the following properties:_

| Property            | Description                                                                                                                                                   | Type                                                                 |
| :------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------- |
| `commands`          | List of commands for different commands                                                                                                                       | _Array of [CommandOrMacro](#commandormacro) items_                   |
| `threads`           | This option should be defined only if commands attribute is absent. Same as commands but array of arrays of commands. Top level of array executes in parallel | _Array of [ReceiversAndMacrosArray](#receiversandmacrosarray) items_ |
| `shuffle`           | If circular set to true, commands in this event would be executed randomly by 1                                                                               | `boolean`                                                            |
| `delay`             | Delay in milliseconds between commands for this shorcut                                                                                                       | `number`                                                             |
| **`name`** (\*)     | Name that is printed during startup with a shorcut                                                                                                            | `string`                                                             |
| **`shortCut`** (\*) | A shorcut to be pressed. E.g. Alt+1                                                                                                                           | `string`                                                             |
| `circular`          | If set to true. Commands in this chain will be executed in a circular way. So each press = 1 command. Instead of full commands                                | `boolean`                                                            |

_(\*) Required._

## TypeTextCommand

Types text on the remote PC.

_Object containing the following properties:_

| Property               | Description                                                   | Type                                |
| :--------------------- | :------------------------------------------------------------ | :---------------------------------- |
| **`typeText`** (\*)    | Any string to type                                            | `string` _or_ [Variable](#variable) |
| **`destination`** (\*) | Remote PC from ips or aliases section to send this command to | `string` _or_ [Variable](#variable) |
| `delay`                | Delay in milliseconds before the next command.                | `number` _or_ [Variable](#variable) |

_(\*) Required._

## Variable

Inject variable with this name. Either can be an environment variable, either a variables passed to a macro from variables section

_String which matches the regular expression `/\{\{\w+\}\}/u`._
