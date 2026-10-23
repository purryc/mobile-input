/** Shared editing surface: textarea and sentence-parameter composer expose the same selection contract. */
export interface TextInputHandle {
 selectionStart:number; selectionEnd:number;
 focus():void; blur():void; select():void; setSelectionRange(start:number,end:number):void;
 inputMode:string; dataset:DOMStringMap;
}
