import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import { beginCell, Builder, Cell, Slice, toNano } from 'ton-core';
import { Task4 } from '../wrappers/Task4';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';

describe('Task4', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Task4');
    });

    let blockchain: Blockchain;
    let task4: SandboxContract<Task4>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        task4 = blockchain.openContract(Task4.createFromConfig({}, code));

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await task4.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: task4.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and task4 are ready to use
    });

    const testTexts: string[] = [
        `aa bbb cA
        very long string abc xyz very long string abc xyz very long string abc xyz very long string abc xyzvery long string abc xyz very long string abc xyz
        qwertyuioip[]asdfgfhgjhkjl;l';zxcxvbnmn,./
        !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_\`abcdefghijklmnopqrstuvwxyz{|}~`,

        "sdfsdfkjf2njfj498fgjh548fgh4g9jh98",

        "f23m4ju9f3jf3u9dj3u8jhde4y82hdf7834gh3t8fgh4h3549f54bnh349hn39jf54nju9n",

        "abcxyz",

        "Hello, world"
    ];

    it('should encrypt caesar code', () => {
        const testStr = "Hello, world";
        const shift = 2;
        const encryptedResult = caesarEncrypt(testStr, shift);
        const decryptedResult = caesarDecrypt(encryptedResult, shift);
        expect(decryptedResult).toEqual(testStr);
    });

    it('should encrypt and decrypt strong strongTestString3', () => {
        const shift = 2;
        const encryptedResult = caesarEncrypt(testTexts[0], shift);
        const decryptedResult = caesarDecrypt(encryptedResult, shift);
        expect(decryptedResult).toEqual(testTexts[0]);
    });

    it('should encrypt and decrypt strong string2', () => {
        const shift = 2;
        const encryptedResult = caesarEncrypt(testTexts[1], shift);
        const decryptedResult = caesarDecrypt(encryptedResult, shift);
        expect(decryptedResult).toEqual(testTexts[1]);
    });

    it('should encrypt and decrypt strong string1', () => {
        const shift = 2;
        const encryptedResult = caesarEncrypt(testTexts[2], shift);
        const decryptedResult = caesarDecrypt(encryptedResult, shift);
        expect(decryptedResult).toEqual(testTexts[2]);
    });


    const shift = 2;
    for (let i = 0; i <  testTexts.length; i++) {
        it(`should encrypt smart contract for ${i}`, async () => {
            const text = testTexts[i];
            const cell: Cell = beginCell()
                .storeUint(0, 32)
                .storeStringTail(testTexts[i])
                .endCell();
            let { result } = await task4.sendCaesarCipherEncrypt({
                shift: BigInt(shift),
                text: cell
            });
            console.log(`Gas used: ${result.gas}`);
            const actual = cellToString("", result.cell);
            const expected = caesarEncrypt(text, shift);
            expect(actual).toEqual(expected);
        });
    }

    for (let i = 0; i < testTexts.length; i++) {
        it(`should decrypt smart contract for ${i}`, async () => {
            const text = testTexts[i];
            const encoded = caesarEncrypt(text, shift);
            const cell: Cell = beginCell()
                .storeUint(1, 32)
                .storeStringTail(encoded)
                .endCell();
            let { result } = await task4.sendCaesarCipherDecrypt({
                shift: BigInt(shift),
                text: cell
            });
            console.log(`Gas used: ${result.gas}`);
            const actual = cellToString("", result.cell);
            expect(actual).toEqual(text);
        });
    }

    const testText = 'abcxyz "da,132309865%@!#$^&*()./ efglkjzxcqwe_|\\~`<>';
    for (let shift = 1; shift < 26; shift++) {
        it(`should encrypt smart contract with shift: ${shift}`, async () => {
            const cell: Cell = beginCell()
                .storeUint(1, 32)
                .storeStringTail(testText)
                .endCell();
            let { result } = await task4.sendCaesarCipherEncrypt({
                shift: BigInt(shift),
                text: cell
            });
            console.log(`Gas used: ${result.gas}`);
            const expected = caesarEncrypt(testText, shift);
            const actual = cellToString("", result.cell);
            expect(actual).toEqual(expected);
        });

        it(`should decrypt smart contract with shift: ${shift}`, async () => {
            const encodedText = caesarEncrypt(testText, shift);
            const cell: Cell = beginCell()
                .storeUint(1, 32)
                .storeStringTail(encodedText)
                .endCell();
            let { result } = await task4.sendCaesarCipherDecrypt({
                shift: BigInt(shift),
                text: cell
            });
            console.log(`Gas used: ${result.gas}`);
            const expected = caesarDecrypt(encodedText, shift);
            const actual = cellToString("", result.cell);
            expect(actual).toEqual(expected);
        });
    }

    function storeText(text: string, b: Builder | undefined) {
        let builder = b ? b : beginCell();
        for (let i = 0; i < text.length; i++) {
            builder = builder.storeUint(text.charCodeAt(i), 8);
        }
        return builder;
    }

    it('test cell encrypt string', async () => {
        const longStr = 'qwertyuiop[]asdfghjkl;zxcvbnm,.~qwertyuiop[]asdfghjkl;zxcvbnm,.~qwertyuiop[]asdfghjkl;zxcvbnm,.~qwertyuiop[]asdfghjkl;zxcvb';
        const longStrCont = 'pizdeckii pizdec';
        const shift = 2;

        const cell1 = storeText(longStrCont, undefined);

        let cell = beginCell();
        cell = cell.storeUint(0, 32);
        cell.storeStringTail(longStr + longStrCont);
        // cell = storeText(longStr, cell);
        // cell = cell.storeRef(cell1.endCell());

        let { result } = await task4.sendCaesarCipherEncrypt({
            shift: BigInt(shift),
            text: cell.endCell()
        });
        console.log(`Gas used: ${result.gas}`);
        const actual = cellToString("", result.cell);
        const expected = caesarEncrypt(longStr + longStrCont, shift);
        // const encryptedCell = funcStyleEncrypt(shift, cell.endCell());
        expect(actual).toEqual(expected);
    });

    it('test cell decrypt string', async () => {
        const shift = 2;
        const longStr = 'qwertyuiop[]asdfghjkl;zxcvbnm,.~qwertyuiop[]asdfghjkl;zxcvbnm,.~qwertyuiop[]asdfghjkl;zxcvbnm,.~qwertyuiop[]asdfghjkl;zxcvb';
        const longStrCont = 'pizdeckii pizdec';
        const encryptedLong = caesarEncrypt(longStr, shift);
        const encryptedCont = caesarEncrypt(longStrCont, shift);

        const cell1 = storeText(encryptedCont, undefined);

        let cell = beginCell();
        cell = cell.storeUint(0, 32);
        cell = storeText(encryptedLong, cell);
        cell = cell.storeRef(cell1.endCell());

        let { result } = await task4.sendCaesarCipherDecrypt({
            shift: BigInt(shift),
            text: cell.endCell()
        });
        console.log(`Gas used: ${result.gas}`);
        const actual = cellToString("", result.cell);
        // const expected = caesarEncrypt(longStr + longStrCont, shift);
        // const encryptedCell = funcStyleEncrypt(shift, cell.endCell());
        expect(actual).toEqual(longStr + longStrCont);
    });

});

function funcStyleEncrypt(shift: number, text: Cell) : Cell {
    let raw: Slice = text.beginParse();
    raw = raw.skip(32);
    if (shift < 0) {
        shift = 26 - (- shift % 26);
    }
    const arr: Builder[] = [];
    const result = encode(arr, beginCell(), raw, shift);

    let root: Cell | null = null;
    for (let i = result.length - 1; i !== -1; i--) {
        if (root === null) {
            root = result[i].endCell();
        } else {
            root = result[i]
                .storeRef(root)
                .endCell();
        }
    }
    console.log(root);
    return <Cell>root;
}

function funcStyleDecrypt(shift: number, text: Cell) : Cell {
    return funcStyleEncrypt(-shift, text);
}

function encode(arr: Builder[], result: Builder, node: Slice, shift: number) : Builder[] {
    while (node.remainingBits !== 0) {
        const char: number = node.loadUint(8);
        const newChar: number = encrypt(char, shift);
        result.storeUint(newChar, 8);
    }

    arr.push(result);
    if (node.remainingRefs !== 0) {
        encode(arr, beginCell(), node.loadRef().beginParse(), shift);
    }

    return arr;
}

function encrypt(char: number, shift: number) {
    const isUpper = char >= 65 && char <= 90;
    if (isUpper || (char >= 97 && char <= 122)) {
        let asciiOffset = isUpper ? 65 : 97;
        return (char - asciiOffset + shift) % 26 + asciiOffset;
    } else {
        return char;
    }
}

function caesarEncrypt(text: string, shift: number) : string {
    if (shift < 0) {
        shift = 26 - (-shift % 26);
    }
    let result = "";
    for (const char of text) {
        const dec: number = char.charCodeAt(0);
        const isUpper = dec >= 65 && dec <= 90;
        if (isUpper || (dec >= 97 && dec <= 122)) {
            let asciiOffset = isUpper ? 65 : 97;
            const crypt = (dec - asciiOffset + shift) % 26 + asciiOffset;
            result += String.fromCharCode(crypt);
        } else {
            result += char;
        }
    }
    return result;
}

function caesarDecrypt(text: string, shift: number) : string {
    return caesarEncrypt(text, -shift);
}

function asciiToUint(str: string) : string {
    let result = "";
    for (const char of str) {
        result += char.charCodeAt(0) + ' ';
    }
    return result;
}

function cellToString(txt: string, cell: Cell) : string {
    const slice = cell.beginParse();
    while (slice.remainingBits > 0) {
        txt += String.fromCharCode(slice.loadUint(8));
    }
    if (slice.remainingRefs > 0) {
        return cellToString(txt, slice.loadRef());
    }
    return txt;
}