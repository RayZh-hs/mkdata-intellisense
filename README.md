<div align="center">
  <img src="https://raw.githubusercontent.com/RayZh-hs/mkdata-intellisense/main/img/logo.png" alt="mkdata-logo" width="180">
</div>

# MkData Intellisense

The MkData Intellisense extension provides intellisense for the MkData Generator Script language.

## Features

✅ Syntax highlighting for .gen, .mkd and .mkdata files;  
✅ Error checking for mkdata scripts;   
🚧 Autocomplete features (work in progress);



## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `myExtension.enable`: Enable/disable this extension.
* `myExtension.thing`: Set to `blah` to do something.

## Known Issues

Some of these are problems inherit to the way vscode uses regex to parse the language. Please consider contributing if you have any ideas on how to fix them.

- Syntax highlighting breaks when syntax lines utilize python expressions including the { character.
- Unpaired quotation marks in comments will lead to false commenting in that line.

## Release Notes

### 1.0.0

Initial release of MkData Intellisense.
