# Schema for config.jsonc

## Aliases

A map for extra layer above destination property. E.g. you can define PC name in IPS section and instead of specifying PC name directly you can use aliases from this section that points to the PC name.

_Object record with dynamic keys:_

- _keys of type_ `string`
- _values of type_ `Array<string> | string`

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

## Ips

_Object record with dynamic keys:_

- _keys of type_ `string`
- _values of type_ `string` (_IP_)

## KeyPressCommand

Sends a keyPress to a remote PC.

_Object containing the following properties:_

| Property               | Description                                                   | Type                                                                                                                                                                                        |
| :--------------------- | :------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`keySend`** (\*)     | A key to be sent.                                             | `'a' \| 'b' \| 'c' \| 'd' \| 'e' \| 'f' \| 'g' \| 'h' \| 'i' \| 'j' \| 'k' \| 'l' \| 'm' \| 'n' \| 'o' \| 'p' \| 'q' \| 'r' \| 's' \| 't' \| ...` _or_ `string` (_regex: `/\{\{\w+\}\}/u`_) |
| **`destination`** (\*) | Remote PC from ips or aliases section to send this command to | `string`                                                                                                                                                                                    |
| `delay`                | Delay in milliseconds before the next command.                | `number` _or_ `string` (_regex: `/\{\{\w+\}\}/u`_)                                                                                                                                          |

_(\*) Required._

## KillExeCommand

Kills a process on the remote PC.

_Object containing the following properties:_

| Property               | Description                                                   | Type                                               |
| :--------------------- | :------------------------------------------------------------ | :------------------------------------------------- |
| **`kill`** (\*)        | Executable file name. E.g. Chrome.exe                         | `string`                                           |
| **`destination`** (\*) | Remote PC from ips or aliases section to send this command to | `string`                                           |
| `delay`                | Delay in milliseconds before the next command.                | `number` _or_ `string` (_regex: `/\{\{\w+\}\}/u`_) |

_(\*) Required._

## LaunchExeCommand

Starts a program on a remote PC.

_Object containing the following properties:_

| Property               | Description                                                   | Type                                               |
| :--------------------- | :------------------------------------------------------------ | :------------------------------------------------- |
| **`launch`** (\*)      | Full path to an executable.                                   | `string`                                           |
| **`destination`** (\*) | Remote PC from ips or aliases section to send this command to | `string`                                           |
| `delay`                | Delay in milliseconds before the next command.                | `number` _or_ `string` (_regex: `/\{\{\w+\}\}/u`_) |

_(\*) Required._

## MacrosList

A map of macro commands, where a key is a macro name. 

_Object record with dynamic keys:_

- _keys of type_ `string`
- _values of type_ _Object with properties:_<ul><li>`commands`: _Array of [Command](#command) items_ - Set of commands for this macro</li><li>`variables`: `Array<string>` - Variables that are used in macros. If you set a option value to {{varName}} in this macro section. If this varName is present in this array, it will be replaced</li></ul>

## MouseClickCommand

Moves mouse to specified coordinates and clicks with left button

_Object containing the following properties:_

| Property               | Description                                                   | Type                                               |
| :--------------------- | :------------------------------------------------------------ | :------------------------------------------------- |
| **`mouseMoveX`** (\*)  | X coordinate                                                  | `number`                                           |
| **`mouseMoveY`** (\*)  | Y coordinate                                                  | `number`                                           |
| **`destination`** (\*) | Remote PC from ips or aliases section to send this command to | `string`                                           |
| `delay`                | Delay in milliseconds before the next command.                | `number` _or_ `string` (_regex: `/\{\{\w+\}\}/u`_) |

_(\*) Required._

## ReceiversAndMacrosArray

A set of events that executed sequentially in this thread

_Array of [CommandOrMacro](#commandormacro) items._

## Root

_Object containing the following properties:_

| Property                | Description                                                                              | Type                                                 |
| :---------------------- | :--------------------------------------------------------------------------------------- | :--------------------------------------------------- |
| **`ips`** (\*)          | Remote PCS ips with their names that are used in destination property                    | [Ips](#ips)                                          |
| `aliases`               | Aliases or remote PCs bindinds                                                           | [Aliases](#aliases)                                  |
| **`delay`** (\*)        | Global delay in miliseconds between commands in order to prevent spam. Could be set to 0 | `number`                                             |
| **`combinations`** (\*) | Shorcuts mappings. Main logic                                                            | _Array of [ShortCutMapping](#shortcutmapping) items_ |
| `macros`                | List of macros in order to omit DRY                                                      | [MacrosList](#macroslist)                            |

_(\*) Required._

## RunMacroCommand

Runs a macro from the macros section.

_Object containing the following properties:_

| Property         | Description                                        | Type                                                                                           |
| :--------------- | :------------------------------------------------- | :--------------------------------------------------------------------------------------------- |
| **`macro`** (\*) | Name of the macro (key from macros section object) | `string`                                                                                       |
| `variables`      | Object of a key-values of variable name and value  | _Object with dynamic keys of type_ `string` _and values of type_ `any` (_optional & nullable_) |
| `delay`          | Delay in milliseconds before the next command.     | `number` _or_ `string` (_regex: `/\{\{\w+\}\}/u`_)                                             |

_(\*) Required._

## ShortCutMapping

An event schema that represent a set of commands that is executed when a cirtain shortkey is pressed

_Object containing the following properties:_

| Property            | Description                                                                                                                                                     | Type                                                                 |
| :------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------- |
| `receivers`         | List of commands for different receivers                                                                                                                        | _Array of [CommandOrMacro](#commandormacro) items_                   |
| `receiversMulti`    | This option should be defined only if receivers attribute is absent. Same as receivers but array of arrays of commands. Top level of array executes in parallel | _Array of [ReceiversAndMacrosArray](#receiversandmacrosarray) items_ |
| `shuffle`           | If circular set to true, commands in this event would be executed randomly by 1                                                                                 | `boolean`                                                            |
| `delay`             | Delay in milliseconds between commands for this shorcut                                                                                                         | `number`                                                             |
| **`name`** (\*)     | Name that is printed during startup with a shorcut                                                                                                              | `string`                                                             |
| **`shortCut`** (\*) | A shorcut to be pressed. E.g. Alt+1                                                                                                                             | `string`                                                             |
| `circular`          | If set to true. Commands in this chain will be executed in a circular way. So each press = 1 command. Instead of full commands                                  | `boolean`                                                            |

_(\*) Required._

## TypeTextCommand

Types text on the remote PC.

_Object containing the following properties:_

| Property               | Description                                                   | Type                                               |
| :--------------------- | :------------------------------------------------------------ | :------------------------------------------------- |
| **`typeText`** (\*)    | Any string to type                                            | `string`                                           |
| **`destination`** (\*) | Remote PC from ips or aliases section to send this command to | `string`                                           |
| `delay`                | Delay in milliseconds before the next command.                | `number` _or_ `string` (_regex: `/\{\{\w+\}\}/u`_) |

_(\*) Required._
