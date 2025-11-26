# battlefield-portal-utils/ui

TypeScript helper utilities that wrap Battlefield Portal’s `mod` UI APIs (see [`battlefield-portal-utils/mod/index.d.ts`](../mod/index.d.ts)) with an object‑oriented `UI` namespace. Drop `ui/ui.ts` into your mod (copy/paste to the top of your script for now) and gain strongly typed helpers, convenient defaults, and ergonomic getters/setters for building complex HUDs, panels, and interactive buttons.

> **Note**  
> The Battlefield Portal runtime still relies on the global `mod` namespace. All types referenced below (`mod.UIWidget`, `mod.Vector`, `mod.UIAnchor`, etc.) are documented in [`mod/index.d.ts`](../mod/index.d.ts). Use that file for authoritative enum members and engine behaviors.

---

## Quick Start

1. Copy `ui/ui.ts` into your mod (or import it if your toolchain supports modules).
2. Register the shared button handler once.
3. Build UI elements.
4. Use the returned objects to show/hide, reposition, mutate text/buttons, define on click behanviour, etc.

### Replacing `modlib.ParseUI`

Battlefield Portal ships `modlib.ParseUI` for nested UI definitions, but it suffers from opaque defaults, no built-in button creation/label helpers, and does not surface runtime objects with setters, getters, or click callbacks. The `UI` class in this module is intended as a drop-in replacement: you still define nested structures, but you also get strongly typed defaults, composable builders, and proper `onClick` handlers that make dynamic menus practical without a messy/bloated `OnPlayerUIButtonEvent` function.

```ts
export async function OnPlayerUIButtonEvent(player: mod.Player, widget: mod.UIWidget, event: mod.UIButtonEvent) {
    await UI.handleButtonClick(player, widget, event);
}
```

```ts
let testMenu: UI.Container | undefined;

export async function OnPlayerDeployed(eventPlayer: mod.Player): Promise<void> {
    mod.EnableUIInputMode(true, eventPlayer);

    if (!testMenu) {
        testMenu = UI.createContainer(
            {
                type: 'container',
                name: 'testMenu',
                x: 0,
                y: 0,
                width: 200,
                height: 300,
                anchor: mod.UIAnchor.Center,
                childrenParams: [
                    {
                        type: 'button',
                        name: 'button_option1',
                        x: 0,
                        y: 0,
                        width: 200,
                        height: 50,
                        anchor: mod.UIAnchor.TopCenter,
                        bgColor: UI.COLORS.GREY_25,
                        baseColor: UI.COLORS.BLACK,
                        onClick: async (player: mod.Player): Promise<void> => {
                            // Do something
                        },
                        label: {
                            message: mod.Message(mod.stringkeys.ui.buttons.option1),
                            textSize: 36,
                            textColor: UI.COLORS.WHITE,
                        },
                    },
                    {
                        type: 'button',
                        name: 'button_option2',
                        x: 0,
                        y: 50,
                        width: 200,
                        height: 50,
                        anchor: mod.UIAnchor.TopCenter,
                        bgColor: UI.COLORS.GREY_25,
                        baseColor: UI.COLORS.BLACK,
                        onClick: async (player: mod.Player): Promise<void> => {
                            // Do something
                        },
                        label: {
                            message: mod.Message(mod.stringkeys.ui.buttons.option2),
                            textSize: 36,
                            textColor: UI.COLORS.WHITE,
                        },
                    },
                    {
                        type: 'button',
                        name: 'button_close',
                        x: 0,
                        y: 0,
                        width: 50,
                        height: 50,
                        anchor: mod.UIAnchor.BottomCenter,
                        bgColor: UI.COLORS.GREY_25,
                        baseColor: UI.COLORS.BLACK,
                        onClick: async (player: mod.Player): Promise<void> => {  
                            mod.EnableUIInputMode(false, player);
                            testMenu?.hide();
                        },
                        label: {
                            message: mod.Message(mod.stringkeys.ui.buttons.close),
                            textSize: 36,
                            textColor: UI.COLORS.WHITE,
                        },
                    },
                ],
                visible: true,
            },
            eventPlayer
        );
    }

    while (true) {
        await mod.Wait(0.5);

        if (!mod.GetSoldierState(player, mod.SoldierStateBool.IsReloading)) continue;

        testMenu?.show();

        mod.EnableUIInputMode(true, player);
    }
}

export async function OnPlayerUIButtonEvent(player: mod.Player, widget: mod.UIWidget, event: mod.UIButtonEvent) {
    await UI.handleButtonClick(player, widget, event);
}
```

---

## Core Concepts

- **`UI` namespace** – A static class that wraps `mod.*` UI functions and keeps track of active buttons/handlers.
- **`UI.UIElement` base contract** – All created elements expose `name`, `uiWidget()`, `isVisible()`, `show()`, `hide()`, `delete()`, `getPosition()`, and `setPosition(x, y)`.
- **`UI.CLICK_HANDLERS`** – Internal `Map<string, (player) => Promise<void>>` that binds `onClick` callbacks to button widget names. `UI.handleButtonClick` looks up handlers when Battlefield Portal fires `OnButtonPressed`.
- **Default colors** – `UI.COLORS` wraps common `mod.CreateVector(r, g, b)` presets so you rarely need to build vectors yourself.
- **Receiver routing** – `createContainer`/`createText`/`createButton` optionally accept `mod.Player | mod.Team` to display UI to a specific audience. When omitted, the widgets are global.

---

## API Reference

### `UI.ROOT: mod.UIWidget`
Root widget from `mod.GetUIRoot()`. All elements default to this parent unless you supply `parent` in params.

### `UI.COLORS`
Prebuilt `mod.Vector` colors: `BLACK`, `GREY_25`, `GREY_50`, `GREY_75`, `WHITE`, `RED`, `GREEN`, `BLUE`, `YELLOW`, `PURPLE`, `CYAN`, `MAGENTA`.

### `UI.CLICK_HANDLERS: Map<string, (player: mod.Player) => Promise<void>>`
Internal registry keyed by button widget names. Updated automatically by `createButton` when `onClick` is provided.

### `UI.createContainer(params, receiver?)`
Creates a container (`mod.AddUIContainer`) and any nested children defined via `childrenParams`.

| Param | Type / Default | Notes |
| --- | --- | --- |
| `name` | `string = UI.randomUiName()` | Auto-generated IDs look like `id_<int>_<int>`. |
| `x`, `y` | `number = 0` | Position relative to `anchor`. |
| `width`, `height` | `number = 0` | Size in screen units. |
| `anchor` | `mod.UIAnchor = mod.UIAnchor.Center` | See `mod/index.d.ts` for enum values. |
| `parent` | `mod.UIWidget = UI.ROOT` | Parent widget. |
| `visible` | `boolean = true` | Initial visibility. |
| `padding` | `number = 0` | Container padding. |
| `bgColor` | `mod.Vector = UI.COLORS.BLACK` | Background color. |
| `bgAlpha` | `number = 1` | Background opacity. |
| `bgFill` | `mod.UIBgFill = mod.UIBgFill.Solid` | Fill mode. |
| `depth` | `mod.UIDepth = mod.UIDepth.AboveGameUI` | Z-order. |
| `childrenParams` | `Array<ContainerParams | TextParams | ButtonParams> = []` | Nested elements automatically receive this container as `parent`. |
| `receiver` | `mod.Player \| mod.Team \| undefined` | Target audience; defaults to global. |

Returns `UI.Container` (see Types).

### `UI.createText(params, receiver?)`
Creates a text widget via `mod.AddUIText`.

| Param | Type / Default | Notes |
| --- | --- | --- |
| `name` | `string = UI.randomUiName()` | Text widget id. |
| `x`, `y`, `width`, `height`, `anchor`, `parent`, `visible`, `padding`, `bgColor`, `bgAlpha`, `bgFill`, `depth` | Same defaults as `ContainerParams` but `bgColor` defaults to `UI.COLORS.WHITE` and `bgFill` defaults to `mod.UIBgFill.None`. |
| `message` | `mod.Message = mod.Message("")` | Text label content (see `mod/index.d.ts` for message helpers). |
| `textSize` | `number = 36` | Font size. |
| `textColor` | `mod.Vector = UI.COLORS.BLACK` |
| `textAlpha` | `number = 1` |
| `textAnchor` | `mod.UIAnchor = mod.UIAnchor.Center` | Alignment inside the text widget. |
| `receiver` | `mod.Player \| mod.Team \| undefined` |

Returns `UI.Text` with `setMessage(message: mod.Message)` helper.

### `UI.createButton(params, receiver?)`
Builds a button by first creating a container, then calling `mod.AddUIButton`. Optionally adds a text label.

| Param | Type / Default | Notes |
| --- | --- | --- |
| `name` | `string = UI.randomUiName()` | Used as container name; actual button widget uses `${name}_button`. |
| `x`, `y`, `width`, `height`, `anchor`, `parent`, `visible`, `padding`, `bgColor`, `bgAlpha`, `bgFill`, `depth` | Inherited from `ContainerParams`, but container `bgAlpha` defaults to `0` and `bgFill` defaults to `mod.UIBgFill.None`. |
| `buttonEnabled` | `boolean = true` |
| `baseColor` / `baseAlpha` | `mod.Vector = UI.COLORS.WHITE`, `number = 1` |
| `disabledColor` / `disabledAlpha` | `mod.Vector = UI.COLORS.GREY_50`, `number = 1` |
| `pressedColor` / `pressedAlpha` | `mod.Vector = UI.COLORS.GREEN`, `number = 1` |
| `hoverColor` / `hoverAlpha` | `mod.Vector = UI.COLORS.CYAN`, `number = 1` |
| `focusedColor` / `focusedAlpha` | `mod.Vector = UI.COLORS.YELLOW`, `number = 1` |
| `onClick` | `(player: mod.Player) => Promise<void>` | Handler stored in `UI.CLICK_HANDLERS`. |
| `label` | `UI.LabelParams \| undefined` | Adds centered text via `createText`. Label inherits `width/height/depth` and forces `visible = true`. |
| `receiver` | `mod.Player \| mod.Team \| undefined` |

Returns `UI.Button` with:
- `buttonName`, `buttonUiWidget()`
- `isEnabled()`, `enable()`, `disable()`
- Optional `labelName`, `labelUiWidget()`, `setLabelMessage(message)`

### `UI.handleButtonClick(player, widget, event)`
Utility callback meant for `mod.OnPlayerUIButtonEvent(player: mod.Player, widget: mod.UIWidget, event: mod.UIButtonEvent)`. Ignores `event` (the Battlefield Portal `mod.UIButtonEvent` is currently unreliable) and resolves the registered `onClick` for the pressed widget.

### `UI.randomUiName()` / `UI.randomInt(min, max)`
Internal helpers that generate unique `id_<min>_<max>` names using `mod.RandomReal` + `mod.RoundToInteger`. Exposed for completeness; most consumers rely on the defaults.

### `UI.getPosition(widget)`
Private helper returning `{ x: number, y: number }` via `mod.GetUIWidgetPosition`. Use the public `getPosition()` on any `UIElement`.

---

## Types & Interfaces

All types are defined inside the `UI` namespace in [`ui.ts`](./ui.ts).

### `UI.Params`
Base shape for positional/layout properties reused by other parameter interfaces. Defaults match the tables above.

### `UI.ContainerParams extends Params`
Adds `childrenParams?: (ContainerParams | TextParams | ButtonParams)[]`.

### `UI.TextParams extends Params`
Adds text-specific fields: `message`, `textSize`, `textColor`, `textAlpha`, `textAnchor`.

### `UI.LabelParams`
Subset of text options (`message`, `textSize`, `textColor`, `textAlpha`) used when attaching a label to a button.

### `UI.ButtonParams extends Params`
Adds button state colors (`base/disabled/pressed/hover/focused` plus alpha values), `buttonEnabled`, `onClick`, and optional `label`.

### `UI.UIElement`
Common runtime contract shared by all created widgets:
```ts
type UIElement = {
    name: string;
    uiWidget: () => mod.UIWidget;
    parent: mod.UIWidget;
    isVisible(): boolean;
    show(): void;
    hide(): void;
    delete(): void;
    getPosition(): { x: number; y: number };
    setPosition(x: number, y: number): void;
};
```

### `UI.Container`
`UIElement & { children: Array<Container | Text | Button> }`.

### `UI.Text`
`UIElement & { setMessage(message: mod.Message): void }`.

### `UI.Button`
`UIElement & { buttonName: string; buttonUiWidget(): mod.UIWidget; isEnabled(): boolean; enable(): void; disable(): void; labelName?: string; labelUiWidget?: () => mod.UIWidget; setLabelMessage?: (message: mod.Message) => void; }`.

---

## Event Wiring & Lifecycle

- Register `UI.handleButtonClick` once per mod to dispatch button presses.
- Use the returned `UIElement` helpers to hide/show instead of calling `mod.SetUIWidgetVisible` manually.
- Always call `delete()` when removing widgets to prevent stale references inside Battlefield Portal.

---

## Further Reference

- [`battlefield-portal-utils/mod/index.d.ts`](../mod/index.d.ts) – Official Battlefield Portal type declarations consumed by this helper.
- Battlefield Builder docs – For runtime UI limitations (widget limits, anchor behavior, etc.).

Feel free to copy/extend `UI.COLORS` or wrap additional `mod` UI primitives following the same patterns shown in `ui/ui.ts`.

---

## Feedback & Support

This helper library is under active development. Feature requests, bug reports, usage questions, or general ideas are always welcome—open an issue or reach out and they’ll be triaged quickly so you can keep shipping Portal experiences without waiting on tooling updates.
