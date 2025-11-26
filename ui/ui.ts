class UI {

    static readonly ROOT = mod.GetUIRoot();

    static readonly COLORS = {
        BLACK: mod.CreateVector(0, 0, 0),
        GREY_25: mod.CreateVector(0.25, 0.25, 0.25),
        GREY_50: mod.CreateVector(0.5, 0.5, 0.5),
        GREY_75: mod.CreateVector(0.75, 0.75, 0.75),
        WHITE: mod.CreateVector(1, 1, 1),
        RED: mod.CreateVector(1, 0, 0),
        GREEN: mod.CreateVector(0, 1, 0),
        BLUE: mod.CreateVector(0, 0, 1),
        YELLOW: mod.CreateVector(1, 1, 0),
        PURPLE: mod.CreateVector(1, 0, 1),
        CYAN: mod.CreateVector(0, 1, 1),
        MAGENTA: mod.CreateVector(1, 0, 1),
    };

    static readonly CLICK_HANDLERS = new Map<string, (player: mod.Player) => Promise<void>>();

    static createContainer(params: UI.ContainerParams, receiver?: mod.Player | mod.Team): UI.Container {
        const name = params.name ?? UI.randomUiName();
        const parent = params.parent ?? UI.ROOT;
    
        const args: [
            string,
            mod.Vector,
            mod.Vector,
            mod.UIAnchor,
            mod.UIWidget,
            boolean,
            number,
            mod.Vector,
            number,
            mod.UIBgFill,
            mod.UIDepth,
        ] = [
            name,
            mod.CreateVector(params.x ?? 0, params.y ?? 0, 0),
            mod.CreateVector(params.width ?? 0, params.height ?? 0, 0),
            params.anchor ?? mod.UIAnchor.Center,
            parent,
            params.visible ?? true,
            params.padding ?? 0,
            params.bgColor ?? UI.COLORS.BLACK,
            params.bgAlpha ?? 1,
            params.bgFill ?? mod.UIBgFill.Solid,
            params.depth ?? mod.UIDepth.AboveGameUI,
        ];
    
        if (receiver == undefined) {
            mod.AddUIContainer(...args);
        } else {
            mod.AddUIContainer(...args, receiver);
        }

        const children = (params.childrenParams ?? []).map(childParams => {
            childParams.parent = mod.FindUIWidgetWithName(name) as mod.UIWidget;

            if (childParams.type === 'container') return UI.createContainer(childParams);
            
            if (childParams.type === 'text') return UI.createText(childParams);
        
            return UI.createButton(childParams as UI.ButtonParams);
        });

        const uiWidget = () => mod.FindUIWidgetWithName(name) as mod.UIWidget;
    
        return {
            name: name,
            uiWidget: uiWidget,
            parent: parent,
            children: children,
            isVisible: () => mod.GetUIWidgetVisible(uiWidget()),
            show: () => mod.SetUIWidgetVisible(uiWidget(), true),
            hide: () => mod.SetUIWidgetVisible(uiWidget(), false),
            delete: () => mod.DeleteUIWidget(uiWidget()),
            getPosition: () => UI.getPosition(uiWidget()),
            setPosition: (x: number, y: number) => mod.SetUIWidgetPosition(uiWidget(), mod.CreateVector(x, y, 0)),
        };
    }

    static createText(params: UI.TextParams, receiver?: mod.Player | mod.Team): UI.Text {
        const name = params.name ?? UI.randomUiName();
        const parent = params.parent ?? UI.ROOT;
    
        const args: [
            string,
            mod.Vector,
            mod.Vector,
            mod.UIAnchor,
            mod.UIWidget,
            boolean,
            number,
            mod.Vector,
            number,
            mod.UIBgFill,
            mod.Message,
            number,
            mod.Vector,
            number,
            mod.UIAnchor,
            mod.UIDepth,
        ] = [
            name,
            mod.CreateVector(params.x ?? 0, params.y ?? 0, 0),
            mod.CreateVector(params.width ?? 0, params.height ?? 0, 0),
            params.anchor ?? mod.UIAnchor.Center,
            parent,
            params.visible ?? true,
            params.padding ?? 0,
            params.bgColor ?? UI.COLORS.WHITE,
            params.bgAlpha ?? 0,
            params.bgFill ?? mod.UIBgFill.None,
            params.message ?? mod.Message(""),
            params.textSize ?? 36,
            params.textColor ?? UI.COLORS.BLACK,
            params.textAlpha ?? 1,
            params.textAnchor ?? mod.UIAnchor.Center,
            params.depth ?? mod.UIDepth.AboveGameUI,
        ];
    
        if (receiver == undefined) {
            mod.AddUIText(...args);
        } else {
            mod.AddUIText(...args, receiver);
        }
    
        const uiWidget = () => mod.FindUIWidgetWithName(name) as mod.UIWidget;

        return {
            name: name,
            uiWidget: uiWidget,
            parent: parent,
            isVisible: () => mod.GetUIWidgetVisible(uiWidget()),
            show: () => mod.SetUIWidgetVisible(uiWidget(), true),
            hide: () => mod.SetUIWidgetVisible(uiWidget(), false),
            delete: () => mod.DeleteUIWidget(uiWidget()),
            getPosition: () => UI.getPosition(uiWidget()),
            setPosition: (x: number, y: number) => mod.SetUIWidgetPosition(uiWidget(), mod.CreateVector(x, y, 0)),
            setMessage: (message: mod.Message) => mod.SetUITextLabel(uiWidget(), message),
        };
    }

    static createButton(params: UI.ButtonParams, receiver?: mod.Player | mod.Team): UI.Button {
        const name = params.name ?? UI.randomUiName();
    
        const containerParams: UI.ContainerParams = {
            name: name,
            x: params.x,
            y: params.y,
            width: params.width,
            height: params.height,
            anchor: params.anchor,
            parent: params.parent,
            visible: params.visible,
            padding: 0,
            bgColor: UI.COLORS.BLACK,
            bgAlpha: 0,
            bgFill: mod.UIBgFill.None,
            depth: params.depth,
        };
    
        const container = UI.createContainer(containerParams, receiver);
        const buttonName = `${name}_button`;

        const containerUiWidget = container.uiWidget();
    
        mod.AddUIButton(
            buttonName,
            mod.CreateVector(0, 0, 0),
            mod.CreateVector(params.width ?? 0, params.height ?? 0, 0),
            params.anchor ?? mod.UIAnchor.Center,
            containerUiWidget,
            true,
            params.padding ?? 0,
            params.bgColor ?? UI.COLORS.BLACK,
            params.bgAlpha ?? 1,
            params.bgFill ?? mod.UIBgFill.Solid,
            params.buttonEnabled ?? true,
            params.baseColor ?? UI.COLORS.WHITE,
            params.baseAlpha ?? 1,
            params.disabledColor ?? UI.COLORS.GREY_50,
            params.disabledAlpha ?? 1,
            params.pressedColor ?? UI.COLORS.GREEN,
            params.pressedAlpha ?? 1,
            params.hoverColor ?? UI.COLORS.CYAN,
            params.hoverAlpha ?? 1,
            params.focusedColor ?? UI.COLORS.YELLOW,
            params.focusedAlpha ?? 1,
            params.depth ?? mod.UIDepth.AboveGameUI,
        );
    
        if (params.onClick) {
            UI.CLICK_HANDLERS.set(buttonName, params.onClick);
        }
    
        const buttonUiWidget = () => mod.FindUIWidgetWithName(buttonName) as mod.UIWidget;

        const button: UI.Button = {
            name: name,
            uiWidget: () => containerUiWidget,
            parent: container.parent,
            buttonName: buttonName,
            buttonUiWidget: buttonUiWidget,
            isVisible: () => mod.GetUIWidgetVisible(containerUiWidget),
            show: () => mod.SetUIWidgetVisible(containerUiWidget, true),
            hide: () => mod.SetUIWidgetVisible(containerUiWidget, false),
            delete: () => mod.DeleteUIWidget(containerUiWidget),
            getPosition: () => UI.getPosition(containerUiWidget),
            setPosition: (x: number, y: number) => mod.SetUIWidgetPosition(containerUiWidget, mod.CreateVector(x, y, 0)),
            isEnabled: () => mod.GetUIButtonEnabled(buttonUiWidget()),
            enable: () => mod.SetUIButtonEnabled(buttonUiWidget(), true),
            disable: () => mod.SetUIButtonEnabled(buttonUiWidget(), false),
        };

        if (!params.label) return button;

        const label = UI.createText({
            ...params.label,
            name: `${button.name}_label`,
            parent: button.uiWidget(),
            width: params.width,
            height: params.height,
            visible: true,
            depth: params.depth,
        });
    
        button.labelName = label.name;
        button.labelUiWidget = label.uiWidget;
        button.setLabelMessage = label.setMessage;
    
        return button;
    }

    static async handleButtonClick(player: mod.Player, widget: mod.UIWidget, event: mod.UIButtonEvent): Promise<void> {
        // NOTE: mod.UIButtonEvent is currently broken or undefined, so we're not using it for now.
        // if (event != mod.UIButtonEvent.ButtonUp) return;

        const clickHandler = UI.CLICK_HANDLERS.get(mod.GetUIWidgetName(widget));

        if (!clickHandler) return;

        await clickHandler(player);
    }

    private static randomUiName(): string {
        return `id_${UI.randomInt(0, 1_000_000)}_${UI.randomInt(0, 1_000_000)}`;
    }
    
    private static randomInt(min: number, max: number): number {
        return mod.RoundToInteger(mod.RandomReal(min, max));
    }

    private static getPosition(widget: mod.UIWidget): { x: number, y: number } {
        const position = mod.GetUIWidgetPosition(widget);
        return { x: mod.XComponentOf(position), y: mod.YComponentOf(position) };
    }
}

namespace UI {

    interface Params {
        type?: string,
        name?: string,
        x?: number,
        y?: number,
        width?: number,
        height?: number,
        anchor?: mod.UIAnchor,
        parent?: mod.UIWidget,
        visible?: boolean,
        padding?: number,
        bgColor?: mod.Vector,
        bgAlpha?: number,
        bgFill?: mod.UIBgFill,
        depth?: mod.UIDepth,
    }

    export interface ContainerParams extends Params {
        childrenParams?: (UI.ContainerParams | UI.TextParams | UI.ButtonParams)[],
    }

    export type UIElement = {
        name: string,
        uiWidget: () => mod.UIWidget,
        parent: mod.UIWidget,
        isVisible: () => boolean,
        show: () => void,
        hide: () => void,
        delete: () => void,
        getPosition: () => { x: number, y: number },
        setPosition: (x: number, y: number) => void,
    }

    export type Container = UI.UIElement & {
        children: (UI.Container | UI.Text | UI.Button)[],
    }

    export interface TextParams extends Params {
        message?: mod.Message,
        textSize?: number,
        textColor?: mod.Vector,
        textAlpha?: number,
        textAnchor?: mod.UIAnchor,
    }
    
    export type Text = UI.UIElement & {
        setMessage: (message: mod.Message) => void,
    }

    export interface LabelParams {
        message?: mod.Message,
        textSize?: number,
        textColor?: mod.Vector,
        textAlpha?: number,
    }

    export interface ButtonParams extends Params {
        buttonEnabled?: boolean,
        baseColor?: mod.Vector,
        baseAlpha?: number,
        disabledColor?: mod.Vector,
        disabledAlpha?: number,
        pressedColor?: mod.Vector,
        pressedAlpha?: number,
        hoverColor?: mod.Vector,
        hoverAlpha?: number,
        focusedColor?: mod.Vector,
        focusedAlpha?: number,
        onClick?: (player: mod.Player) => Promise<void>,
        label?: LabelParams,
    }
    
    export type Button = UI.UIElement & {
        buttonName: string,
        buttonUiWidget: () => mod.UIWidget,
        isEnabled: () => boolean,
        enable: () => void,
        disable: () => void,
        labelName?: string,
        labelUiWidget?: () => mod.UIWidget,
        setLabelMessage?: (message: mod.Message) => void,
    }

}
