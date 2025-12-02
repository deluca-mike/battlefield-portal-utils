// version: 1.0.0

// NOTE: Requires the parent UI module.

interface IUIBar extends UI.Element {}

class UIBar implements IUIBar {

    private bar: UI.Container;

    private fill: UI.Container;

    private width: number;

    private height: number;

    private borderThickness: number;

    private maxValue: number;

    private value: number;

    constructor(params: UIBar.Params, receiver?: mod.Player | mod.Team) {
        this.width = params.width;
        this.height = params.height;
        this.borderThickness = params.borderThickness ?? 1;
        this.maxValue = params.maxValue ?? 100;
        this.value = params.value ?? 0;

        this.bar = UI.createContainer({
            name: params.name,
            x: params.x,
            y: params.y,
            width: this.width,
            height: this.height,
            anchor: params.anchor,
            parent: params.parent,
            visible: params.visible,
            bgColor: params.emptyColor,
            bgAlpha: params.emptyAlpha,
            bgFill: params.emptyFill,
            depth: params.depth,
            childrenParams: [
                {   // Top Border
                    type: UI.Type.Container,
                    x: 0,
                    y: 0,
                    width: this.width,
                    height: this.borderThickness,
                    anchor: mod.UIAnchor.TopLeft,
                    bgColor: params.fillColor,
                    bgAlpha: params.fillAlpha,
                    bgFill: params.fillFill,
                    depth: params.depth,
                },
                {   // Left Border
                    type: UI.Type.Container,
                    x: 0,
                    y: 0,
                    width: this.borderThickness,
                    height: this.height,
                    anchor: mod.UIAnchor.TopLeft,
                    bgColor: params.fillColor,
                    bgAlpha: params.fillAlpha,
                    bgFill: params.fillFill,
                    depth: params.depth,
                },
                {   // Bottom Border
                    type: UI.Type.Container,
                    x: 0,
                    y: 0,
                    width: this.width,
                    height: this.borderThickness,
                    anchor: mod.UIAnchor.BottomRight,
                    bgColor: params.fillColor,
                    bgAlpha: params.fillAlpha,
                    bgFill: params.fillFill,
                    depth: params.depth,
                },
                {   // Right Border
                    type: UI.Type.Container,
                    x: 0,
                    y: 0,
                    width: this.borderThickness,
                    height: this.height,
                    anchor: mod.UIAnchor.BottomRight,
                    bgColor: params.fillColor,
                    bgAlpha: params.fillAlpha,
                    bgFill: params.fillFill,
                    depth: params.depth,
                },
                {   // Fill
                    type: UI.Type.Container,
                    x: 0,
                    y: 0,
                    width: this.getFillWidth(),
                    height: this.height,
                    anchor: mod.UIAnchor.TopLeft,
                    bgColor: params.fillColor,
                    bgAlpha: params.fillAlpha,
                    bgFill: params.fillFill,
                    depth: params.depth,
                },
            ],
        }, receiver);

        this.fill = this.bar.children[4] as UI.Container;
    }

    private getFillWidth(): number {
        if (this.value === 0) return 0;

        if (this.value >= this.maxValue) return this.width;

        const innerWidth = this.width - (this.borderThickness * 2);

        return innerWidth * (this.value / this.maxValue) + this.borderThickness;
    }

    public setValue(value: number): void {
        this.value = value;
        this.fill.setSize(this.getFillWidth(), this.height);
    }

    public show(): void {
        this.bar.show();
    }

    public hide(): void {
        this.bar.hide();
    }

    public delete(): void {
        this.bar.delete();
    }

    public isVisible(): boolean {
        return this.bar.isVisible();
    }

    public getPosition(): { x: number, y: number } {
        return this.bar.getPosition();
    }

    public setPosition(x: number, y: number): void {
        this.bar.setPosition(x, y);
    }

    public getSize(): { width: number, height: number } {
        return this.bar.getSize();
    }

    public setSize(width: number, height: number): void {
        this.height = height;
        this.width = width;
        this.bar.setSize(width, height); // TODO: Update fill and borders.
        this.bar.children[0].setSize(width, this.borderThickness); // Top Border
        this.bar.children[1].setSize(this.borderThickness, height); // Left Border
        this.bar.children[2].setSize(width, this.borderThickness); // Bottom Border
        this.bar.children[3].setSize(this.borderThickness, height); // Right Border
        this.fill.setSize(this.getFillWidth(), height);
    }

    public get type(): UI.Type {
        return UI.Type.Container;
    }

    public get name(): string {
        return this.bar.name;
    }

    public get uiWidget(): () => mod.UIWidget {
        return this.bar.uiWidget;
    }

    public get parent(): UI.Node {
        return this.bar.parent;
    }

}

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
