// NOTE: Requires the UI module.
// NOTE: Requires the contents of the `logger.strings.json` file to be loaded.

class Logger {

    constructor(
        player: mod.Player,
        staticRows: boolean = true,
        corner: mod.UIAnchor.TopLeft | mod.UIAnchor.BottomLeft | mod.UIAnchor.TopRight | mod.UIAnchor.BottomRight = mod.UIAnchor.TopLeft,
    ) {
        this.window = UI.createContainer({
            name: 'loggerWindow',
            x: 10,
            y: 10,
            width: 400,
            height: 300,
            anchor: corner,
            bgColor: UI.COLORS.BLACK,
            bgAlpha: 0.5,
            padding: 10,
            visible: false,
        }, player);

        this.staticRows = staticRows;
    }

    private window: UI.Container;

    private staticRows: boolean;

    private rows: { [rowIndex: number]: UI.Container } = {};

    private nextRowIndex: number = 13;

    isVisible(): boolean {
        return this.window.isVisible();
    }

    show(): void {
        this.window.show();
    }

    hide(): void {
        this.window.hide();
    }

    clear(): void {
        Object.keys(this.rows).forEach(key => this.deleteRow(parseInt(key)));
    }

    destroy(): void {
        this.clear();
        this.window.delete();
    }

    log(text: string, rowIndex: number): void {
        return this.staticRows ? this.logInRow(text, rowIndex) : this.logNext(text);
    }

    private logInRow(text: string, rowIndex: number): void {
        if (rowIndex > 13) return; // Actually, this should be an error.
        
        const row = this.createRow(rowIndex);

        const parts = (text.match(/.{1,3}/g) ?? []) as string[];

        parts.reduce((accumulator, part, index) => {
            if (accumulator < 0) return accumulator; // Text was too long and has been truncated.

            if (accumulator >= 368) {
                Logger.createPartText(row, rowIndex, index, '...', accumulator);
                return -1; // Indicates that the text is too long and has been truncated.
            }

            return accumulator + Logger.createPartText(row, rowIndex, index, part, accumulator);
        }, 0);
    }

    private logNext(text: string): void {
        const { rowIndex, row } = this.prepareNextRowForLog();

        const parts = (text.match(/.{1,3}/g) ?? []) as string[];

        parts.reduce((accumulator, part, index) => {
            if (accumulator < 0) return accumulator; // Text was too long and has been truncated.

            if (accumulator >= 368) {
                Logger.createPartText(row, rowIndex, index, '...', accumulator);
                return -1; // Indicates that the text is too long and has been truncated.
            }

            return accumulator + Logger.createPartText(row, rowIndex, index, part, accumulator);
        }, 0);
    }

    private prepareNextRowForLog(): { rowIndex: number, row: UI.Container } {
        const rowIndex = this.nextRowIndex;
        const row = this.createRow(rowIndex, 13 * 20);

        this.nextRowIndex = (rowIndex + 1) % 14;

        Object.values(this.rows).forEach((row, index) => {
            if (!row) return;

            const { y } = row.getPosition();

            if (y <= 1) return this.deleteRow(index);

            row.setPosition(0, y - 20);
        });

        return { rowIndex, row };
    }

    private createRow(rowIndex: number, y?: number): UI.Container {
        this.deleteRow(rowIndex);

        const row = UI.createContainer({
            name: `loggerRow_${rowIndex}`,
            x: 0,
            y: y ?? (20 * rowIndex),
            width: 380,
            height: 18,
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

    private static getPartWidth(part: string): number {
        return part.split('').reduce((accumulator, character) => {
            return accumulator + Logger.getCharacterWidth(character);
        }, 0);
    }

    private static getCharacterWidth(char: string): number {
        if (['W', 'm', '@'].includes(char)) return 14;
        if (['M', 'w'].includes(char)) return 12.5;
        if (['#', '?'].includes(char)) return 12;
        if (['-', '+', '='].includes(char)) return 11.5;
        if (['U', '&', '~'].includes(char)) return 11;
        if (['C', 'D', 'G', 'H', 'N', 'O', 'Q', 'S', '$', '%', '<', '>'].includes(char)) return 10.5;
        if (['0', '3', '6', '8', '9', 'A', 'B', 'V', 'X', '_'].includes(char)) return 10;
        if (['2', '4', '5', 'E', 'F', 'K', 'P', 'R', 'T', 'Y', 'Z', 'a', 'h', 'n', 's'].includes(char)) return 9.5;
        if (['7', 'L', 'b', 'c', 'd', 'e', 'g', 'o', 'p', 'q', 'u', '^', '*', '`'].includes(char)) return 9;
        if (['k', 'v', 'x', 'y', 'z'].includes(char)) return 8.5; // TODO: Maybe 'x' could be 8.
        if (['J', '[', ']', '"'].includes(char)) return 8;
        if (['1'].includes(char)) return 7.5;
        if (['\\', '/'].includes(char)) return 7; // TODO: Issue with '['
        if (['r'].includes(char)) return 6.5; // TODO: Maybe 'r' should be 6.
        if (['f', ' ', '{', '}'].includes(char)) return 6; // TODO: Maybe 'f' should be 5.5. Maybe ' ' should be 5.
        if (['t'].includes(char)) return 5.5; // TODO: Maybe 't' should be 6.
        if (['(', ')', ','].includes(char)) return 5;
        if (['\'', ';'].includes(char)) return 4.5;
        if (['!', 'I', '|', '.' , ':'].includes(char)) return 4;
        if (['i', 'j', 'l'].includes(char)) return 3.5;

        return 10;
    }

    private static createPartText(row: UI.Container, rowIndex: number, index: number, part: string, x: number): number {
        const partWidth = Logger.getPartWidth(part);

        UI.createText({
            name: `loggerText_${rowIndex}_${index}`,
            x: x,
            y: 0,
            width: partWidth,
            height: 18,
            anchor: mod.UIAnchor.CenterLeft,
            parent: row.uiWidget(),
            message: Logger.buildMessage(part),
            textSize: 20,
            textColor: UI.COLORS.GREEN,
            textAnchor: mod.UIAnchor.CenterLeft,
        });

        return partWidth;
    }

    private static buildMessage = (part: string): mod.Message => {
        if (part.length === 3) return mod.Message(mod.stringkeys.logger.format[3], mod.stringkeys.logger.chars[part[0]], mod.stringkeys.logger.chars[part[1]], mod.stringkeys.logger.chars[part[2]]);

        if (part.length === 2) return mod.Message(mod.stringkeys.logger.format[2], mod.stringkeys.logger.chars[part[0]], mod.stringkeys.logger.chars[part[1]]);

        if (part.length === 1) return mod.Message(mod.stringkeys.logger.format[1], mod.stringkeys.logger.chars[part[0]]);

        return mod.Message(mod.stringkeys.logger.format.badFormat);
    };

}
