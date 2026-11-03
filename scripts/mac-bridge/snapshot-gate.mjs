/** Background AX scans yield to live pointer gestures; business writes stay authoritative. */
export class SnapshotGate {
 constructor(now=()=>performance.now(),quietMs=250){this.now=now;this.quietMs=quietMs;this.pointerUntil=0;}
 pointer(){this.pointerUntil=this.now()+this.quietMs;}
 canPoll(){return this.now()>=this.pointerUntil;}
}
