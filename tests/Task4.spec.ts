import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import { beginCell, Cell, toNano } from 'ton-core';
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

        "💩💩💩💩💩sdfsdfkjf2njfj498fgjh548fgh4g9jh98",

        "f23m4ju9f3jf3u9dj3u8jhde4y82hdf7834gh3t8fgh4h3549f54bnh349hn39jf54nju9n",

        "abcxyz",

        "Hello, world"
    ];

    it.skip('should check len', async () => {
        const shift: number = 3;
        const targetStr = "Hello, world";
        const text: Cell = beginCell()
            .storeUint(1, 32)
            .storeStringTail(targetStr)
            .endCell();
        let { result } = await task4.sendCaesarCipherEncrypt({
            shift: BigInt(shift),
            text: text
        });
        console.log(`Gas used: ${result.gas}`);
        const actual = cellToString(result.cell);
        console.log(`Correct blya: ${actual} == ${asciiToUint(targetStr)}`);
    });

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
    for (let i = 0; i < testTexts.length; i++) {
        it(`should encrypt smart contract for ${i}`, async () => {
            const text = testTexts[i];
            const cell: Cell = beginCell()
                .storeUint(1, 32)
                .storeStringTail(text)
                .endCell();
            let { result } = await task4.sendCaesarCipherEncrypt({
                shift: BigInt(shift),
                text: cell
            });
            console.log(`Gas used: ${result.gas}`);
            const actual = cellToString(result.cell);
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
            const actual = cellToString(result.cell);
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
            const actual = cellToString(result.cell);
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
            const actual = cellToString(result.cell);
            expect(actual).toEqual(expected);
        });
    }

});

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

function cellToString(cell: Cell) : string {
    let txt = "";
    const slice = cell.beginParse();
    while (slice.remainingBits > 0) {
        txt += String.fromCharCode(slice.loadUint(8));
    }
    return txt;
}