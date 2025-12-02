# battlefield-portal-utils/ui/custom/bar

A custom UI bar component built on top of the `UI` module. Effectively a "meta" element to provide higher-level abstractions for common UI patterns, allowing you to create complex UI elements without directly manipulating the underlying Battlefield Portal UI API.

> **Note**  
> All custom UI components require the parent `UI` module (see [`../../README.md`](../../README.md)). Copy both `ui/ui.ts` and the custom component files into your mod.

---

## Quick Start

A customizable progress bar component that can be used for health bars, progress indicators, resource meters, and more. `UIBar` wraps multiple `UI.Container` elements to create a bordered bar with a fill that automatically adjusts based on a value-to-maximum ratio.

```ts
// Copy ui/ui.ts and ui/custom/bar.ts into your mod

let healthBar: UIBar | undefined;

export function OnPlayerDeployed(eventPlayer: mod.Player): Promise<void> {
    // Likely save this in a way that is linked to the player.
    healthBar = new UIBar(
        {
            x: 0,
            y: 200,
            width: 300,
            height: 20,
            anchor: mod.UIAnchor.BottomCenter,
            borderThickness: 2,
            emptyColor: UI.COLORS.BLACK,
            emptyAlpha: 0.6,
            fillColor: UI.COLORS.RED,
            fillAlpha: 1.0,
            value: 100,
            maxValue: 100,
            visible: true,
        },
        eventPlayer
    );

    // Put this call somewhere it is actually needed.
    healthBar.?setValue(mod.Max(0, victim.health - damageInfo.damage));
}
```

---

## Core Concepts

- **`UIBar` class** – A custom UI element that implements `UI.Element`, providing a progress bar with configurable borders and fill.
- **Bordered design** – The bar consists of a background container with four border elements and a fill container that represents the current value.
- **Value-based fill** – The fill width is automatically calculated based on the ratio of `value` to `maxValue`, accounting for border thickness.
- **Element compatibility** – Since `UIBar` implements `UI.Element`, it can be used anywhere a `UI.Node` is expected (e.g., as a `parent` in other UI element constructors).

---

## API Reference

### `new UIBar(params, receiver?)`

Creates a new progress bar instance.

| Param | Type / Default | Notes |
| --- | --- | --- |
| `name` | `string` | Widget name. Auto-generated if omitted (follows `UI` naming conventions). |
| `x`, `y` | `number = 0` | Position relative to `anchor`. |
| `width` | `number` | **Required.** Bar width in screen units, inclusive or border thickness. |
| `height` | `number` | **Required.** Bar height in screen units, inclusive or border thickness. |
| `anchor` | `mod.UIAnchor = mod.UIAnchor.Center` | Anchor point for positioning. See `mod/index.d.ts` for enum values. |
| `parent` | `mod.UIWidget \| UI.Node \| undefined` | Parent widget or node. Defaults to `UI.root()` when omitted. |
| `visible` | `boolean = true` | Initial visibility. |
| `borderThickness` | `number = 1` | Thickness of the border in screen units. Borders use `fillColor`, `fillAlpha`, and `fillFill` for styling. |
| `emptyColor` | `mod.Vector = UI.COLORS.BLACK` | Background color of the empty/unfilled portion of the bar. |
| `emptyAlpha` | `number = 1` | Background opacity of the empty portion. |
| `emptyFill` | `mod.UIBgFill = mod.UIBgFill.Solid` | Fill mode for the empty portion. |
| `fillColor` | `mod.Vector = UI.COLORS.WHITE` | Color of the filled portion and borders. |
| `fillAlpha` | `number = 1` | Opacity of the filled portion and borders. |
| `fillFill` | `mod.UIBgFill = mod.UIBgFill.Solid` | Fill mode for the filled portion and borders. |
| `depth` | `mod.UIDepth = mod.UIDepth.AboveGameUI` | Z-order for all bar elements. |
| `value` | `number = 0` | Current value. Must be between `0` and `maxValue` (clamped automatically). |
| `maxValue` | `number = 100` | Maximum value. Used to calculate fill percentage. |
| `receiver` | `mod.Player \| mod.Team \| undefined` | Target audience; defaults to global. |

Returns a `UIBar` instance (see Types).

### `UIBar.setValue(value: number): void`

Updates the bar's current value and automatically adjusts the fill width. The value is clamped between `0` and `maxValue`.

```ts
healthBar.setValue(75); // Sets value to 75, fill updates automatically
```

### `UIBar.show(): void`

Makes the bar visible.

### `UIBar.hide(): void`

Hides the bar.

### `UIBar.delete(): void`

Removes the bar and all its child elements from the UI. Always call this when removing bars to prevent stale references.

### `UIBar.isVisible(): boolean`

Returns `true` if the bar is currently visible.

### `UIBar.getPosition(): { x: number, y: number }`

Returns the current position of the bar relative to its anchor.

### `UIBar.setPosition(x: number, y: number): void`

Repositions the bar to the specified coordinates relative to its anchor.

### `UIBar.getSize(): { width: number, height: number }`

Returns the current size of the bar.

### `UIBar.setSize(width: number, height: number): void`

Resizes the bar, automatically updating all border elements and the fill to maintain proper proportions.

### Properties

- `type: UI.Type` – Always returns `UI.Type.Container`.
- `name: string` – The name of the underlying container widget.
- `uiWidget: () => mod.UIWidget` – Returns the underlying container's UI widget.
- `parent: UI.Node` – The parent node of the bar.

---

## Types & Interfaces

### `UIBar`

The main class that implements `UI.Element`. All instances expose the standard `UI.Element` interface plus `setValue()` and `setSize()` methods.

```ts
class UIBar implements UI.Element {
    setValue(value: number): void;
    show(): void;
    hide(): void;
    delete(): void;
    isVisible(): boolean;
    getPosition(): { x: number, y: number };
    setPosition(x: number, y: number): void;
    getSize(): { width: number, height: number };
    setSize(width: number, height: number): void;
    readonly type: UI.Type;
    readonly name: string;
    readonly uiWidget: () => mod.UIWidget;
    readonly parent: UI.Node;
}
```

### `UIBar.Params`

Configuration interface for creating a `UIBar` instance.

```ts
namespace UIBar {
    export interface Params {
        name?: string,
        x?: number,
        y?: number,
        width: number,
        height: number,
        anchor?: mod.UIAnchor,
        parent?: mod.UIWidget | UI.Node,
        visible?: boolean,
        borderThickness?: number,
        emptyColor?: mod.Vector,
        emptyAlpha?: number,
        emptyFill?: mod.UIBgFill,
        fillColor?: mod.Vector,
        fillAlpha?: number,
        fillFill?: mod.UIBgFill,
        depth?: mod.UIDepth,
        value?: number,
        maxValue?: number,
    }
}
```

---

## Implementation Details

- **Internal structure** – `UIBar` creates a parent container with five child containers: four borders (top, left, bottom, right) and one fill element. The fill element is stored as `this.fill` and is automatically resized when `setValue()` is called.
- **Fill calculation** – The fill width is calculated as: `innerWidth * (value / maxValue) + borderThickness`, where `innerWidth = width - (borderThickness * 2)`. This ensures the fill accounts for the left border and extends to the right border when at maximum.
- **Border styling** – All borders use the same `fillColor`, `fillAlpha`, and `fillFill` parameters, creating a cohesive border appearance.
- **Size updates** – When `setSize()` is called, all border elements and the fill are automatically resized to maintain proper proportions.

---

## Further Reference

- [`../../README.md`](../../README.md) – Parent `UI` module documentation
- [`battlefield-portal-utils/mod/index.d.ts`](../../../mod/index.d.ts) – Official Battlefield Portal type declarations

---

## Feedback & Support

This custom component is part of the battlefield-portal-utils library. Feature requests, bug reports, or usage questions are welcome—open an issue or reach out for assistance.

