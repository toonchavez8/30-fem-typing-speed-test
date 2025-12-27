import { CharacterState } from "../types";

const NORMALIZATION_MAP: Record<string, string> = {
	"\u2018": "'", // Left single quote
	"\u2019": "'", // Right single quote
	"\u201C": '"', // Left double quote
	"\u201D": '"', // Right double quote
	"\u2014": "-", // Em dash
	"\u2013": "-", // En dash
};

export function normalizeText(input: string): string {
    return NORMALIZATION_MAP[input] || input;

}


//check if typed character maches expected character given at index

export function isCharacterCorrect(
    typed: string,
    expected: string,
    index: number
): boolean {
    const normalizedTypedChar = normalizeText(typed[index] || "");
    const normalizedExpectedChar = normalizeText(expected[index] || "");
    return normalizedTypedChar === normalizedExpectedChar;
}   

// validated entire typed input against papage, shoul retturn array of character states for each character in passage

export function validateTypedInput(
    typedValue: string,
    passage:string
): CharacterState[] {
    return passage.split("").map((char,index)=>{
        if (index >= typedValue.length){
            return {character:char, state:"untyped" as const, index}
        }
        const isCorrect = isCharacterCorrect(typedValue,passage,index)

        return{
            character:char,
            state: isCorrect?("correct" as const):("incorrect" as const),
            index,
		};
	});
}