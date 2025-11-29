// version: 1.1.1

// NOTE: Requires the UI module.
// NOTE: Requires the contents of the `logger.strings.json` file to be loaded.

class Logger {

    static readonly PADDING: number = 10;

    constructor(
        player: mod.Player,
        options?: Logger.Options
    ) {
        this.width = options?.width ?? 400;
        this.height = options?.height ?? 300;
        this.textColor = options?.textColor ?? UI.COLORS.GREEN;

        this.window = UI.createContainer({
            x: options?.x ?? 10,
            y: options?.y ?? 10,
            width: this.width,
            height: this.height,
            parent: options?.parent,
            anchor: options?.anchor ?? mod.UIAnchor.TopLeft,
            bgColor: options?.bgColor ?? UI.COLORS.BLACK,
            bgAlpha: options?.bgAlpha ?? 0.5,
            padding: Logger.PADDING,
            visible: options?.visible ?? false,
        }, player);

        this.staticRows = options?.staticRows ?? false;
        this.truncate = this.staticRows || (options?.truncate ?? false);
        // this.scaleFactor = options?.textScale === 'small' ? 0.8 : options?.textScale === 'large' ? 1.2 : 1;
        this.scaleFactor = 1; // TODO: Implement fixes/corrections for part widths when scale factor is not 1.
        this.rowHeight = 20 * this.scaleFactor;
        this.maxRows = ~~((this.height - Logger.PADDING) / this.rowHeight); // round down to nearest integer
        this.nextRowIndex = this.maxRows - 1;
    }

    private window: UI.Container;

    private staticRows: boolean;

    private truncate: boolean;

    private rows: { [rowIndex: number]: UI.Container } = {};

    private nextRowIndex: number;

    private width: number;

    private height: number;

    private textColor: mod.Vector;

    private scaleFactor: number;

    private rowHeight: number;

    maxRows: number;

    name(): string {
        return this.window.name;
    }

    isVisible(): boolean {
        return this.window.isVisible();
    }

    show(): void {
        this.window.show();
    }

    hide(): void {
        this.window.hide();
    }

    toggle(): void {
        this.isVisible() ? this.hide() : this.show();
    }

    clear(): void {
        Object.keys(this.rows).forEach(key => this.deleteRow(parseInt(key)));
    }

    destroy(): void {
        this.clear();
        this.window.delete();
    }

    log(text: string, rowIndex?: number): void {
        return this.staticRows ? this.logInRow(text, rowIndex ?? 0) : this.logNext(text);
    }

    private logInRow(text: string, rowIndex: number): void {
        if (rowIndex >= this.maxRows) return; // Actually, this should be an error.

        this.fillRow(this.createRow(rowIndex), Logger.getParts(text));
    }

    private logNext(text: string): void {
        this.logNextParts(Logger.getParts(text));
    }

    private logNextParts(parts: string[]): void {
        const remaining = this.fillRow(this.prepareNextRow(), parts);

        if (!remaining) return;

        this.logNextParts(remaining);
    }

    private fillRow(row: UI.Container, parts: string[]): string[] | null {
        let x = 0;
        let lastPartIndex = -1;

        for (let i = 0; i < parts.length; ++i) {
            const isLastPart = i === parts.length - 1;

            if (this.rowLimitReached(x, parts[i], isLastPart)) {
                if (this.truncate) {
                    this.createPartText(row, '...', x, 3);
                    return null;
                }

                return parts.slice(lastPartIndex + 1);
            }

            // Extra width of 3 for the last part (which likely does not have 3 characters).
            x += this.createPartText(row, parts[i], x, isLastPart ? 3 : 0);

            lastPartIndex = i;
        }

        return null;
    }

    private rowLimitReached(x: number, part: string, isLastPart: boolean): boolean {
        const limit = this.width - (Logger.PADDING * 2) - 3; // the row width minus the padding and 3 extra.

        // The early limit is the row width minus the padding, the width of the largest possible part and the width of the ellipsi.
        if (x + 57 <= limit) return false;

        // The last part is too long.
        if (isLastPart && (x + this.getTextWidth(part) >= limit)) return true;

        // The part plus the width of the ellipsis is too long.
        if (x + this.getTextWidth(part) + 12 >= limit) return true;

        return false;
    }

    private prepareNextRow(): UI.Container {
        const rowIndex = this.nextRowIndex;
        const row = this.createRow(rowIndex, (this.maxRows - 1) * this.rowHeight);

        this.nextRowIndex = (rowIndex + 1) % this.maxRows;

        Object.values(this.rows).forEach((row, index) => {
            if (!row) return;

            const { y } = row.getPosition();

            if (y <= 1) return this.deleteRow(index);

            row.setPosition(0, y - this.rowHeight);
        });

        return row;
    }

    private createRow(rowIndex: number, y?: number): UI.Container {
        this.deleteRow(rowIndex);

        const row = UI.createContainer({
            x: 0,
            y: y ?? (this.rowHeight * rowIndex),
            width: this.width - (Logger.PADDING * 2),
            height: this.rowHeight,
            anchor: mod.UIAnchor.TopLeft,
            parent: this.window.uiWidget(),
            bgFill: mod.UIBgFill.None,
        });

        this.rows[rowIndex] = row;

        return row;
    }

    private deleteRow(rowIndex: number): void { 
        this.rows[rowIndex]?.delete();
        delete this.rows[rowIndex];
    }

    private createPartText(row: UI.Container, part: string, x: number, extraWidth: number = 0): number {
        if (part === ' ') return 7; // Space won't be a character, but instead just an instruction for the next part to be offset by 7.

        const partWidth = this.getTextWidth(part) + extraWidth;

        UI.createText({
            x: x,
            y: 0,
            width: partWidth,
            height: this.rowHeight,
            anchor: mod.UIAnchor.CenterLeft,
            parent: row.uiWidget(),
            message: Logger.buildMessage(part),
            textSize: this.rowHeight,
            textColor: this.textColor,
            textAnchor: mod.UIAnchor.CenterLeft,
        });

        return partWidth;
    }

    private getTextWidth(part: string): number {
        return this.scaleFactor * part.split('').reduce((accumulator, character) => accumulator + Logger.getCharacterWidth(character), 0);
    }

    private static getParts(text: string): string[] {
        return (text.match(/( |[^ ]{1,3})/g) ?? []) as string[];
    }

    private static getCharacterWidth(char: string): number {
        if (['W', 'm', '@'].includes(char)) return 14;
        if (['['].includes(char)) return 13; // TODO: '[' is always prepended by a '\', so needs to be larger than ']'.
        if (['M', 'w'].includes(char)) return 12.5;
        if (['#', '?', '+'].includes(char)) return 12;
        if (['-', '='].includes(char)) return 11.5;
        if (['U', '$', '%', '&', '~'].includes(char)) return 11;
        if (['C', 'D', 'G', 'H', 'N', 'O', 'Q', 'S', '<', '>'].includes(char)) return 10.5;
        if (['0', '3', '6', '8', '9', 'A', 'B', 'V', 'X', '_'].includes(char)) return 10;
        if (['2', '4', '5', 'E', 'F', 'K', 'P', 'R', 'Y', 'Z', 'a', 'h', 's'].includes(char)) return 9.5;
        if (['7', 'b', 'c', 'd', 'e', 'g', 'n', 'o', 'p', 'q', 'u', '^', '*', '`'].includes(char)) return 9;
        if (['L', 'T', 'k', 'v', 'x', 'y', 'z'].includes(char)) return 8.5; // TODO: Maybe 'x' could be 8.
        if (['J', ']', '"', '\\', '/'].includes(char)) return 8;
        if (['1'].includes(char)) return 7.5;
        if ([' '].includes(char)) return 7;
        if (['r'].includes(char)) return 6.5; // TODO: Maybe 'r' should be 6.
        if (['f', '{', '}'].includes(char)) return 6; // TODO: Maybe 'f' should be 5.5.
        if (['t'].includes(char)) return 5.5;
        if (['(', ')', ','].includes(char)) return 5;
        if (['\'', ';'].includes(char)) return 4.5;
        if (['!', 'I', '|', '.' , ':'].includes(char)) return 4;
        if (['i', 'j', 'l'].includes(char)) return 3.5;

        return 10;
    }

    private static buildMessage(part: string): mod.Message {
        if (part.length === 3) return mod.Message(mod.stringkeys.logger.format[3], Logger.getChar(part[0]), Logger.getChar(part[1]), Logger.getChar(part[2]));
        if (part.length === 2) return mod.Message(mod.stringkeys.logger.format[2], Logger.getChar(part[0]), Logger.getChar(part[1]));
        if (part.length === 1) return mod.Message(mod.stringkeys.logger.format[1], Logger.getChar(part[0]));

        return mod.Message(mod.stringkeys.logger.format.badFormat);
    };

    private static getChar(char: string): string {
        return mod.stringkeys.logger.chars[char] ?? mod.stringkeys.logger.chars['*'];
    }

}

namespace Logger {

    export interface Options {
        staticRows?: boolean,
        truncate?: boolean,
        parent?: mod.UIWidget | UI.Node,
        anchor?: mod.UIAnchor,
        x?: number,
        y?: number,
        width?: number,
        height?: number,
        bgColor?: mod.Vector,
        bgAlpha?: number,
        bgFill?: mod.UIBgFill,
        textColor?: mod.Vector,
        textScale?: 'small' | 'medium' | 'large',
        visible?: boolean,
    }

}
