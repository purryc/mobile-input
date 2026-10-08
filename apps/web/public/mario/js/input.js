import Keyboard from './KeyboardState.js';
export function setupKeyboard(entity){const input=new Keyboard();const keys=new Set();
input.addMapping('Space',state=>{if(state)entity.jump.start();else entity.jump.cancel();});
for(const code of ['ArrowLeft','ArrowRight'])input.addMapping(code,state=>{if(state)keys.add(code);else keys.delete(code);entity.go.dir=(keys.has('ArrowRight')?1:0)-(keys.has('ArrowLeft')?1:0);});return input;}
export function setupKeyboardPlayer2(entity){return new Keyboard();}
