export function multiply(a,scale) { return {x:a.x*scale, y:a.y*scale, z:a.z*scale}; };
export function add(a,b) {          return {x:a.x+b.x, y:a.y+b.y, z:a.z+b.z}; };
export function subtract(a,b) {     return {x:a.x-b.x, y:a.y-b.y, z:a.z-b.z}; };
export function dot(a,b) {          return a.x*b.x + a.y*b.y + a.z*b.z; };
export function norm(a) {           return Math.hypot(a.x, a.y, a.z); };
export function cross(a,b) {        return {x:a.y*b.z-a.z*b.y , y:a.z*b.x-b.z*a.x , z:a.x*b.y-b.x*a.y} };

export function gRl_2_rpy_vec(R) {
  // This doesn't do any preprocessing of R, R should be a right-handed transformation matrix
  // in order for this routine to return reasonable results
  return {
    x: Math.atan2(R[2][1], R[2][2]),
    y: Math.asin(-R[2][0]), // between -pi/2 and pi/2  
    z: Math.atan2(R[1][0], R[0][0])
  };
}

export function global_2_local_R_from_rpy(xyz) {
  var cx = Math.cos(xyz.x),   sx = Math.sin(xyz.x);
  var cy = Math.cos(xyz.y),   sy = Math.sin(xyz.y);
  var cz = Math.cos(xyz.z),   sz = Math.sin(xyz.z);
  return [[cz*cy, cz*sy*sx-sz*cx, cz*sy*cx+sz*sx],
          [sz*cy, sz*sy*sx+cz*cx, sz*sy*cx-cz*sx],
          [-sy,          cy*sx,          cy*cx]];
};

export function local_from_global(xyz) {
// From global to body frame = Rx*Ry*Rz
// Rx = [1  0   0  ;  0 Cx Sx  ;  0 -Sx  Cx]
// Ry = [Cy 0 -Sy  ;  0  1  0  ;  Sy  0  Cy]
// Rz = [Cz Sz  0  ; -Sz Cz 0  ;   0  0   1]
  var cx = Math.cos(xyz.x),   sx = Math.sin(xyz.x);
  var cy = Math.cos(xyz.y),   sy = Math.sin(xyz.y);
  var cz = Math.cos(xyz.z),   sz = Math.sin(xyz.z);
  return [[cz*cy,   sz*cy,   -sy], 
          [cz*sy*sx-sz*cx, sz*sy*sx+cz*cx, cy*sx],
          [cz*sy*cx+sz*sx, sz*sy*cx-cz*sx, cy*cx]]
};

export function d_global_from_local_dt(p,v) {
  var cx = Math.cos(p.x),   sx = Math.sin(p.x);
  var cy = Math.cos(p.y),   sy = Math.sin(p.y);
  var cz = Math.cos(p.z),   sz = Math.sin(p.z);
  return [[-cz*sy*v.y - sz*cy*v.z,
            -sz*sy*sx*v.z + cz*cy*sx*v.y + cz*sy*cx*v.x - cz*cx*v.z + sz*sx*v.x,
            -sz*sy*cx*v.z + cz*cy*cx*v.y - cz*sy*sx*v.x + cz*sx*v.z + sz*cx*v.x],
          [cz*cy*v.z - sz*sy*v.y,
            cz*sy*sx*v.z + sz*cy*sx*v.y + sz*sy*cx*v.x - sz*cx*v.z - cz*sx*v.x,
            cz*sy*cx*v.z + sz*cy*cx*v.y - sz*sy*sx*v.x + sz*sx*v.z - cz*cx*v.x],
          [-cy*v.y,
            -sy*sx*v.y + cy*cx*v.x,
            -sy*cx*v.y - cy*sx*v.x]];
};

export function transpose(R) {
    return [[R[0][0], R[1][0], R[2][0]],
            [R[0][1], R[1][1], R[2][1]],
            [R[0][2], R[1][2], R[2][2]]];
}

export function matrix_multiply(w,v) {
    return {x:v.x*w[0][0] + v.y*w[0][1] + v.z*w[0][2],
            y:v.x*w[1][0] + v.y*w[1][1] + v.z*w[1][2],
            z:v.x*w[2][0] + v.y*w[2][1] + v.z*w[2][2],
    };
}

export function unwrap_angle(q) {
  return q += (q < -Math.PI) ?  2*Math.PI*Math.floor((Math.PI-q)/2/Math.PI)
            : (q >  Math.PI) ? -2*Math.PI*Math.floor((Math.PI+q)/2/Math.PI) : 0;
}
// [0,-0,999,-1.0001,0.9999,1.0001].forEach(q => { // TEST WRAP
//   for (var ii = 0; ii < 10; ii++) {
//     let qq = q*Math.PI + Math.floor((Math.random()-0.5)*100)*2*Math.PI;
//     console.log(q,unwrap_angle(qq)/Math.PI);
//   }
// })

