export type Quaternion={x:number;y:number;z:number;w:number};
export function orientationPoint(base:Quaternion,current:Quaternion){
 const n=(q:Quaternion)=>{const length=Math.hypot(q.x,q.y,q.z,q.w);return length>0&&Number.isFinite(length)?{x:q.x/length,y:q.y/length,z:q.z/length,w:q.w/length}:null;};
 const a=n(base),b=n(current);if(!a||!b)return null;
 const x=a.w*b.x-a.x*b.w-a.y*b.z+a.z*b.y,y=a.w*b.y+a.x*b.z-a.y*b.w-a.z*b.x,z=a.w*b.z-a.x*b.y+a.y*b.x-a.z*b.w,w=a.w*b.w+a.x*b.x+a.y*b.y+a.z*b.z;
 // Rotate the phone's +Y (top-edge) ray in the calibrated phone basis.
 // Screen-up neutral: +X right, +Y toward tablet, +Z up. Roll about +Y does not steer.
 const dx=2*(x*y-w*z),dy=1-2*(x*x+z*z),dz=2*(y*z+w*x);
 const yaw=Math.atan2(dx,dy),pitch=Math.atan2(dz,Math.hypot(dx,dy));
 const gain=1.30/(Math.PI/3),clamp=(v:number)=>Math.max(0,Math.min(1,v));
 return {x:clamp(.5+yaw*gain),y:clamp(.5-pitch*gain)};
}
