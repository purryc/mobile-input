import Timer from './Timer.js';
import {loadLevel,loadEnemies} from './loaders.js';
import Entity from './Entity.js';
import {createMario, createLuigi, createMushroomHead} from './entities.js';
import {createCollisionLayer} from './layers.js';
import {setupKeyboard, setupKeyboardPlayer2} from './input.js';

const canvas = document.getElementById('screen');
const context = canvas.getContext('2d');

Promise.all([
    createMario(),
    createMushroomHead(),
    loadEnemies('1-1'),
    createLuigi(),
    loadLevel('1-1'),
])
.then(([mario, mushroomHeadSprite, enemiesSpec, luiji, level]) => {
    mario.pos.set(12, 12);

    //level.comp.layers.push(createCollisionLayer(level));

    enemiesSpec.forEach((enemy) => {

        const mushRoomHead = new Entity("Mushroomhead");
        mushRoomHead.size.set(14, 16);

        mushRoomHead.draw = function drawMushroomhead(context) {
            mushroomHeadSprite.draw('idle', context, this.pos.x, this.pos.y);
        }
        mushRoomHead.pos.set(enemy.location.x, enemy.location.y);
        mushRoomHead.vel.x = enemy.vel;
        level.entities.add(mushRoomHead);

    })
    level.entities.add(mario);

    // level.entities.add(luiji);

    const input = setupKeyboard(mario);
    input.listenTo(window);


    const inputPlayer2 = setupKeyboardPlayer2(luiji);
    inputPlayer2.listenTo(window);

    let remoteKeys=new Set(), paused=false, lastRemote=0, lastReport=0;
    function applyKeys(next){for(const code of ['ArrowLeft','ArrowRight','Space']){if(remoteKeys.has(code)!==next.has(code))input.handleEvent({code,type:next.has(code)?'keydown':'keyup',preventDefault(){}});}remoteKeys=next;}
    window.addEventListener('message',event=>{if(event.source!==parent||event.data?.kind!=='mobile-control')return;const next=new Set((event.data.keys||[]).filter(k=>['ArrowLeft','ArrowRight','Space'].includes(k)));paused=!!event.data.paused;lastRemote=performance.now();applyKeys(paused?new Set():next);});
    window.addEventListener('blur',()=>applyKeys(new Set()));
    document.addEventListener('visibilitychange',()=>{if(document.hidden)applyKeys(new Set());});
    setInterval(()=>{if(remoteKeys.size&&performance.now()-lastRemote>700)applyKeys(new Set());},150);
    parent.postMessage({kind:'mario-ready'},'*');
    const timer = new Timer(1/60);
    timer.update = function update(deltaTime) {
        if(paused)return;
        if(mario.pos.y>850){mario.pos.set(12,12);mario.vel.set(0,0);}
        level.update(deltaTime);

        mario.pos.x=Math.max(0,Math.min(946,mario.pos.x));
        context.fillStyle='#60a8ef';context.fillRect(0,0,canvas.width,canvas.height);
        context.save();context.translate(-Math.max(0,Math.min(480,mario.pos.x-150)),32);
        level.comp.draw(context);context.restore();
        if(performance.now()-lastReport>100){lastReport=performance.now();parent.postMessage({kind:'mario-state',x:mario.pos.x,y:mario.pos.y,keys:[...remoteKeys],paused},'*');}
    }

    timer.start();
});