import { IParser, ParserFactoryBase } from 'lite-ts-parser';
import lodash from 'lodash';
import { utils, WorkBook, WorkSheet } from 'xlsx';

import { IEnumFactory } from './i-enum-factory';
import { ISheetParseOption, SheetParser } from './sheet-parser';

export abstract class ParserBase implements IParser {
    private m_SheetParser: IParser;

    public constructor(
        enumFactory: IEnumFactory,
        parserFactory: ParserFactoryBase,
    ) {
        this.m_SheetParser ??= new SheetParser(enumFactory, parserFactory);
    }

    public async parse(v: string) {
        const wb = await this.getWorkbook(v);
        const result = {};
        for (const r of wb.SheetNames) {
            wb.Sheets[r]['!ref'] = this.getSheetRange(wb.Sheets[r]);
            result[r] = await this.m_SheetParser.parse({
                rows: utils.sheet_to_json(wb.Sheets[r]),
                sheetName: r,
            } as ISheetParseOption);
        }
        return result;
    }

    protected abstract getWorkbook(v: string): Promise<WorkBook>;

    private getSheetRange(sheet: WorkSheet) {
        const sheetWithValues = lodash.pickBy(sheet, r => !!r.v);
        const cellNames = lodash.keys(sheetWithValues);
        const cellAddreses = cellNames.map(r => {
            return utils.decode_cell(r);
        });
        const maxRow = lodash.max(
            cellAddreses.map(r => r.r),
        );
        const maxCell = lodash.max(
            cellAddreses.map(r => r.c),
        );
        const lastCell = utils.encode_cell({
            c: maxCell,
            r: maxRow,
        });
        return `A1:${lastCell}`;
    }
}