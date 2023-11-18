export function box_inertia(dx,dy,dz,density) {
  var mass = density*dx*dy*dz;
  var Ix = (dy*dy+dz*dz)*mass/12;
  var Iy = (dx*dx+dz*dz)*mass/12;
  var Iz = (dy*dy+dx*dx)*mass/12;
  return {mass:mass,Ix:Ix,Iy:Iy,Iz:Iz,Ixy:0,Izx:0,Iyz:0};
}

export function ellipsoid_inertia(dx,dy,dz,density) {
  var mass = density*dx*dy*dz*4/3*Math.PI;
  var Ix = (dy*dy+dz*dz)*mass/5;
  var Iy = (dx*dx+dz*dz)*mass/5;
  var Iz = (dy*dy+dx*dx)*mass/5;
  return {mass:mass,Ixx:Ix,Iyy:Iy,Izz:Iz,Ixy:0,Izx:0,Iyz:0};
}
