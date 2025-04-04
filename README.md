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

Only changes that are reflected in the minor version section are listed here. For a full list of changes, please refer to the [changelog](CHANGELOG.md).

### 1.0.x

Private release of MkData Intellisense.

### 1.1.x

Added diagnosis capacity for mkdata scripts and customizable settings.