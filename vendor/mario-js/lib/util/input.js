const input = {
  paused: false,
  down: {},
  pressed: {},

  init() {
    let last=Date.now();
    const clear=()=>{this.down={};this.pressed={};};
    window.addEventListener('message',e=>{
      if(e.source!==window.parent||e.origin!==location.origin||e.data?.kind!=='mobile-control')return;
      last=Date.now();this.paused=!!e.data.paused;
      const map={ArrowLeft:37,ArrowRight:39,Space:32,Shift:16};
      const next={};for(const key of e.data.keys||[])if(map[key])next[map[key]]=true;
      for(const key of Object.keys(this.down))if(!next[key])delete this.pressed[key];
      this.down=next;if(this.paused)clear();
    });
    window.addEventListener('blur',clear);
    document.addEventListener('visibilitychange',()=>{if(document.hidden){clear();this.paused=true;}});
    setInterval(()=>{if(Date.now()-last>750)clear();},150);

    window.addEventListener('keydown', (event) => {
      this.down[event.keyCode] = true;
    });

    window.addEventListener('keyup', (event) => {
      delete this.down[event.keyCode];
      delete this.pressed[event.keyCode];
    });
  },

  update(data) {
    const mario = data.entities.mario;

    if (data.userControl) {
      mario.velX = this.isDown(16) ? 3.8 : 2.4;
      // Move Left. Left-Arrow or A
      if (this.isDown(37) || this.isDown(65)) {
        if (mario.velY === 1.2) {
          if (mario.bigMario) {
            mario.currentState = mario.states.bigWalking;
          } else {
            mario.currentState = mario.states.walking;
          }
        } else {
          mario.xPos -= mario.velX;
        }
        mario.direction = 'left';
      }
      // Move Right. Right-Arrow or D
      if (this.isDown(39) || this.isDown(68)) {
        if (mario.velY === 1.2) {
          if (mario.bigMario) {
            mario.currentState = mario.states.bigWalking;
          } else {
            mario.currentState = mario.states.walking;
          }
        } else {
          mario.xPos += mario.velX;
        }
        mario.direction = 'right';
      }

      // Jump. Up-Arrow, W, or Spacebar
      if (this.isPressed(38) || this.isPressed(32) || this.isPressed(87)) {
        if (mario.bigMario) {
          mario.currentState = mario.states.bigJumping;
        } else {
          mario.currentState = mario.states.jumping;
        }
      }
    } else {
      mario.currentState = mario.states.dead;
    }
  },

  isDown(code) {
    return this.down[code];
  },

  isPressed(code) {
    if (this.pressed[code]) {
      return false;
    } else if (this.down[code]) {
      this.pressed[code] = true;
      return this.pressed[code];
    }
  },
};

export { input as default };
