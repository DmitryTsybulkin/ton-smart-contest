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
        let str = "";
        const slice = result.cell.beginParse();
        while (slice.remainingBits > 0) {
            str += slice.loadUint(8);
            str += ' ';
        }
        console.log(`Sizhu, ohuel: ${str} == ${asciiToUint(targetStr)}`);
    });

    it('should encrypt caesar code', () => {
        const testStr = "Hello, world";
        const shift = 2;
        const encryptedResult = caesarEncrypt(testStr, shift);
        const decryptedResult = caesarDecrypt(encryptedResult, shift);
        expect(decryptedResult).toEqual(testStr);
    });
});

function caesarEncrypt(text: string, shift: number) : string {
    let result = "";
    for (const char of text) {
        const dec: number = char.charCodeAt(0);
        let asciiOffset;
        if (dec >= 65 || dec <= 90) {
            asciiOffset = 65;
        } else {
            asciiOffset = 97;
        }
        const crypt = (dec - asciiOffset + shift) % 26 + asciiOffset;
        result += String.fromCharCode(crypt);
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