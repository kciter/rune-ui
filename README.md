# Rune UI

A lightweight, composable UI component library for building web interfaces using Rune.

## Overview

Rune UI is a headless component library that leverages state machines for reliable UI behavior. It focuses on creating reusable, composable UI components with predictable state management.

## Features

- **State Machine Based**: Every component is built on a finite state machine for predictable behavior
- **Lightweight**: Minimal dependencies with a focus on performance
- **Composable**: Components can be easily combined and extended
- **Accessible**: Built with accessibility in mind
- **Customizable**: Flexible styling options through CSS

## Getting Started

```bash
# Install with npm
npm install @rune-ui/archetype

# Or with yarn
yarn add @rune-ui/archetype

# Or with pnpm
pnpm add @rune-ui/archetype
```

## Basic Usage

```tsx
import { Toggle } from "@rune-ui/archetype";
import { View } from "rune-ts";
import { createHtml } from "@rune-ui/jsx";

class MyToggle extends View {
  override template() {
    return (
      <Toggle.Root>
        <Toggle.Track>
          <Toggle.Thumb />
        </Toggle.Track>
        <Toggle.Label>Enable notifications</Toggle.Label>
      </Toggle.Root>
    );
  }
}
```

## Packages
Rune UI is built on several core packages:

* @rune-ui/archetype: Core UI components
* @rune-ui/machine: State machine implementation
* @rune-ui/jsx: JSX renderer for component templates
* @rune-ui/anatomy: Component structure definitions
* @rune-ui/types: TypeScript type definitions

## Contributing
Contributions are welcome! Please feel free to submit a pull request.

## License
MIT
