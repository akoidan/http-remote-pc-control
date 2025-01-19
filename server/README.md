# Schema for config.jsonc

## AARoot

_Object containing the following properties:_

| Property                | Description                                                                                                                                                                                                     | Type                                                                             |
| :---------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------- |
| **`ips`** (\*)          | Definition of remote PCs where keys are PC names and values are their IP addresses. The IP address should be available to a remote PC. You can also use https://ngrok.com/ to get public address or create VPN  | _Object with dynamic keys of type_ `string` _and values of type_ `string` (_IP_) |
| `aliases`               | A map for extra layer above destination property. E.g. you can define PC name in IPS section and instead of specifying PC name directly you can use aliases from this section that points to the PC name.       | `Record<string, Array<string> \| string>`                                        |
| `variables`             | Set of variable desciption along with default values                                                                                                                                                            | [Variables](#variables)                                                          |
| **`delay`** (\*)        | Global delay in miliseconds between commands in order to prevent spam. Could be set to 0                                                                                                                        | `number`                                                                         |
| **`combinations`** (\*) | Shorcuts mappings. Main logic                                                                                                                                                                                   | _Array of [ShortCutMapping](#shortcutmapping) items_                             |
| `macros`                | A map of macros where a key is the macro name and value is its body                                                                                                                                             | [MacrosMap](#macrosmap)                                                          |

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
- [FocusWindowCommand](#focuswindowcommand)
- [TypeTextCommand](#typetextcommand)
- [KillExeCommand](#killexecommand)

## FocusWindowCommand

Focuses window with the provided PID, making it active

_Object containing the following properties:_

| Property               | Description                                                   | Type                                               |
| :--------------------- | :------------------------------------------------------------ | :------------------------------------------------- |
| **`focusPid`** (\*)    | Pid of the process that has this window                       | `string` (_regex: `/\{\{\w+\}\}/u`_) _or_ `number` |
| **`destination`** (\*) | Remote PC from ips or aliases section to send this command to | `string` _or_ `string` (_regex: `/\{\{\w+\}\}/u`_) |
| `delay`                | Delay in milliseconds before the next command.                | `number` _or_ `string` (_regex: `/\{\{\w+\}\}/u`_) |

_(\*) Required._

## KeyPressCommand

Sends a keyPress to a remote PC.

_Object containing the following properties:_

| Property               | Description                                                   | Type                                                                                |
| :--------------------- | :------------------------------------------------------------ | :---------------------------------------------------------------------------------- |
| **`keySend`** (\*)     |                                                               | [Key](#key), `string` (_regex: `/\{\{\w+\}\}/u`_) _or_ _Array of [Key](#key) items_ |
| `holdKeys`             | A key to be sent.                                             | [Key](#key), `string` (_regex: `/\{\{\w+\}\}/u`_) _or_ _Array of [Key](#key) items_ |
| **`destination`** (\*) | Remote PC from ips or aliases section to send this command to | `string` _or_ `string` (_regex: `/\{\{\w+\}\}/u`_)                                  |
| `delay`                | Delay in milliseconds before the next command.                | `number` _or_ `string` (_regex: `/\{\{\w+\}\}/u`_)                                  |

_(\*) Required._

## Key

A key to be sent.

_Enum string, one of the following possible values:_

<details>
<summary><i>Expand for full list of 132 values</i></summary>

- `'a'`
- `'b'`
- `'c'`
- `'d'`
- `'e'`
- `'f'`
- `'g'`
- `'h'`
- `'i'`
- `'j'`
- `'k'`
- `'l'`
- `'m'`
- `'n'`
- `'o'`
- `'p'`
- `'q'`
- `'r'`
- `'s'`
- `'t'`
- `'u'`
- `'v'`
- `'w'`
- `'x'`
- `'y'`
- `'z'`
- `'f1'`
- `'f2'`
- `'f3'`
- `'f4'`
- `'f5'`
- `'f6'`
- `'f7'`
- `'f8'`
- `'f9'`
- `'f10'`
- `'f11'`
- `'f12'`
- `'f13'`
- `'f14'`
- `'f15'`
- `'f16'`
- `'f17'`
- `'f18'`
- `'f19'`
- `'f20'`
- `'f21'`
- `'f22'`
- `'f23'`
- `'f24'`
- `'0'`
- `'1'`
- `'2'`
- `'3'`
- `'4'`
- `'5'`
- `'6'`
- `'7'`
- `'8'`
- `'9'`
- `'numpad_0'`
- `'numpad_1'`
- `'numpad_2'`
- `'numpad_3'`
- `'numpad_4'`
- `'numpad_5'`
- `'numpad_6'`
- `'numpad_7'`
- `'numpad_8'`
- `'numpad_9'`
- `'numpad_decimal'`
- `'space'`
- `'escape'`
- `'tab'`
- `'alt'`
- `'control'`
- `'right_alt'`
- `'right_control'`
- `'win'`
- `'right_win'`
- `'cmd'`
- `'right_cmd'`
- `'menu'`
- `'fn'`
- `'shift'`
- `'command'`
- `'right_shift'`
- `'command'`
- `'`'`
- `'-'`
- `'='`
- `'backspace'`
- `'['`
- `']'`
- `'\'`
- `';'`
- `'''`
- `'enter'`
- `','`
- `'.'`
- `'/'`
- `'left'`
- `'up'`
- `'right'`
- `'down'`
- `'printscreen'`
- `'insert'`
- `'delete'`
- `'home'`
- `'end'`
- `'pageup'`
- `'pagedown'`
- `'add'`
- `'subtract'`
- `'multiply'`
- `'divide'`
- `'enter'`
- `'caps_lock'`
- `'scroll_lock'`
- `'num_lock'`
- `'audio_mute'`
- `'audio_vol_down'`
- `'audio_vol_up'`
- `'audio_play'`
- `'audio_stop'`
- `'audio_pause'`
- `'audio_prev'`
- `'audio_next'`
- `'audio_rewind'`
- `'audio_forward'`
- `'audio_repeat'`
- `'audio_random'`

</details>

## KillExeCommand

Kills a process on the remote PC.

_Object containing the following properties:_

| Property               | Description                                                   | Type                                               |
| :--------------------- | :------------------------------------------------------------ | :------------------------------------------------- |
| **`kill`** (\*)        | Executable file name. E.g. Chrome.exe                         | `string` _or_ `string` (_regex: `/\{\{\w+\}\}/u`_) |
| **`destination`** (\*) | Remote PC from ips or aliases section to send this command to | `string` _or_ `string` (_regex: `/\{\{\w+\}\}/u`_) |
| `delay`                | Delay in milliseconds before the next command.                | `number` _or_ `string` (_regex: `/\{\{\w+\}\}/u`_) |

_(\*) Required._

## LaunchExeCommand

Starts a program on a remote PC.

_Object containing the following properties:_

| Property               | Description                                                            | Type                                               |
| :--------------------- | :--------------------------------------------------------------------- | :------------------------------------------------- |
| **`launch`** (\*)      | Full path to an executable.                                            | `string`                                           |
| `arguments`            | Array of arguments to an executable                                    | `Array<string>`                                    |
| `waitTillFinish`       | Waits until executable finishes to run before running the next command | `boolean`                                          |
| `assignId`             | Assigns PID of launched command to a variable that can be used after   | `string`                                           |
| **`destination`** (\*) | Remote PC from ips or aliases section to send this command to          | `string` _or_ `string` (_regex: `/\{\{\w+\}\}/u`_) |
| `delay`                | Delay in milliseconds before the next command.                         | `number` _or_ `string` (_regex: `/\{\{\w+\}\}/u`_) |

_(\*) Required._

## Macro

A macro that can be injected instead of command. That will run commands from its body. Can be also injected with variables. Think of it like a function

_Object containing the following properties:_

| Property            | Description                                                                                                                                                      | Type                                 |
| :------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------- |
| **`commands`** (\*) | Set of commands for this macro                                                                                                                                   | _Array of [Command](#command) items_ |
| `variables`         | Variables that are used in macros. If you set a option value to {{varName}} in this macro section. If this varName is present in this array, it will be replaced | `Array<string>`                      |

_(\*) Required._

## MacrosMap

A map of macros where a key is the macro name and value is its body

_Object record with dynamic keys:_

- _keys of type_ `string`
- _values of type_ [Macro](#macro)
 (_optional_)

## MouseClickCommand

Moves mouse to specified coordinates and clicks with left button

_Object containing the following properties:_

| Property               | Description                                                   | Type                                               |
| :--------------------- | :------------------------------------------------------------ | :------------------------------------------------- |
| **`mouseMoveX`** (\*)  | X coordinate                                                  | `number` _or_ `string` (_regex: `/\{\{\w+\}\}/u`_) |
| **`mouseMoveY`** (\*)  | Y coordinate                                                  | `number` _or_ `string` (_regex: `/\{\{\w+\}\}/u`_) |
| **`destination`** (\*) | Remote PC from ips or aliases section to send this command to | `string` _or_ `string` (_regex: `/\{\{\w+\}\}/u`_) |
| `delay`                | Delay in milliseconds before the next command.                | `number` _or_ `string` (_regex: `/\{\{\w+\}\}/u`_) |

_(\*) Required._

## ReceiversAndMacrosArray

A set of events that executed sequentially in this thread

_Array of [CommandOrMacro](#commandormacro) items._

## RunMacroCommand

Runs a macro from the macros section.

_Object containing the following properties:_

| Property         | Description                                        | Type                                               |
| :--------------- | :------------------------------------------------- | :------------------------------------------------- |
| **`macro`** (\*) | Name of the macro (key from macros section object) | `string`                                           |
| `variables`      | Object of a key-values of variable name and value  | `Record<string, string \| number>`                 |
| `delay`          | Delay in milliseconds before the next command.     | `number` _or_ `string` (_regex: `/\{\{\w+\}\}/u`_) |

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

| Property               | Description                                                   | Type                                               |
| :--------------------- | :------------------------------------------------------------ | :------------------------------------------------- |
| **`typeText`** (\*)    | Any string to type                                            | `string` _or_ `string` (_regex: `/\{\{\w+\}\}/u`_) |
| **`destination`** (\*) | Remote PC from ips or aliases section to send this command to | `string` _or_ `string` (_regex: `/\{\{\w+\}\}/u`_) |
| `delay`                | Delay in milliseconds before the next command.                | `number` _or_ `string` (_regex: `/\{\{\w+\}\}/u`_) |

_(\*) Required._

## VariableDescription

A variable that can be injected instead of command

_Object containing the following properties:_

| Property        | Description                              | Type                   |
| :-------------- | :--------------------------------------- | :--------------------- |
| **`type`** (\*) | if number, parseInt will be used         | `'string' \| 'number'` |
| `defaultValue`  | default value if not others are provided | `any` (_nullable_)     |

_(\*) Required._

## Variables

Set of variable desciption along with default values

_Object record with dynamic keys:_

- _keys of type_ `string`
- _values of type_ [VariableDescription](#variabledescription)
 (_optional_)
