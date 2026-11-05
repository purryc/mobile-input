/** Background AX scans yield to live pointer gestures; business writes stay authoritative. */
export class SnapshotGate {
 constructor(now=()=>performance.now(),quietMs=250){this.now=now;this.quietMs=quietMs;this.pointerUntil=0;}
 pointer(){this.pointerUntil=this.now()+this.quietMs;}
 canPoll(){return this.now()>=this.pointerUntil;}
}

/** Native relative movement reads the real cursor. Its position alone must not
 * retransmit an entire AX snapshot over a bandwidth-limited Bluetooth link.
 * The full snapshot (including pointer) is still delivered on any other change. */
export function snapshotFingerprint(state, pointerIndependent = false) {
 if (!pointerIndependent) return JSON.stringify(state);
 const {pointer, ...authoritative} = state;
 return JSON.stringify(authoritative);
}
