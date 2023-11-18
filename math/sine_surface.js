import { get_RNG } from '../math/seedrandom.js'; 
import { grid_surface } from './grid_surface.js'; 

const twopi = 2*Math.PI;

const WIDTH_FACTOR_1 = Math.pow(2*(0.975 - 0.5),2);
const WIDTH_FACTOR = Math.sqrt(WIDTH_FACTOR_1/(1-WIDTH_FACTOR_1));

const sigheight = function(x, y, arena_radius) {
  let radius = arena_radius/2;
  let width95 = 3*arena_radius/4;
  let l = radius - Math.sqrt(x*x + y*y), height = 1;
  let m = l * WIDTH_FACTOR * 2 / width95;
  return (height*m/2) / Math.sqrt(1.0 + m*m)  +  height * 0.5;
}

const sigmoid = function(x, y, arena_radius) {
  let radius = arena_radius/2;
  let width95 = 3*arena_radius/4;
  let arg = x*x + y*y, dargdx = 2*x, dargdy = 2*y, d2argdx2 = 2, d2argdy2 = 2;
  if (arg < 0.001) return {z:1,dzdx:0,dzdy:0,d2zdx2:0,d2zdy2:0,d2zdxdy:0};
  let a2 = Math.sqrt(arg);
  let l = radius - a2;
  let dldarg = -0.5/a2;
  let d2ldarg2 = 0.25/a2/arg;
  let dldx = dldarg*dargdx, dldy = dldarg*dargdy;
  let d2ldx2 = d2ldarg2*dargdx*dargdx + dldarg*d2argdx2;
  let d2ldy2 = d2ldarg2*dargdy*dargdy + dldarg*d2argdy2;
  let d2ldxdy = d2ldarg2*dargdx*dargdy;
  let m = WIDTH_FACTOR * 2 / width95;  // z = (l*m/sqrt(1+m*m)/2 + 0.5);
  let mm = m*m;
  let B = Math.sqrt(1.0 + mm*l*l);
  let dBdl = (mm*l)/B;
  let BB = B*B;
  let dBBdl = 2*B*dBdl;
  let d2Bdl2 = (B*mm - mm*l*dBdl) / BB;
  let height = 1;
  let surf = {};
  surf.z = (height*m/2) * l / B  +  height * 0.5;
  let dzdl = (height*m/2) * (B - l*dBdl) / BB;
  let a = -BB*l*d2Bdl2; //BB*(dBdl - (dBdl + l*d2Bdl2));
  let b = (B - l*dBdl)*dBBdl;
  let c = BB*BB;
  let d2zdl2 = (height*m/2) * (a - b) / c;
  surf.dzdx = dzdl*dldx;
  surf.dzdy = dzdl*dldy;
  let xx = dldx*dldx;
  let yy = dldy*dldy;
  let xy = dldx*dldy;
  surf.d2zdx2 = d2zdl2*xx + dzdl*d2ldx2;
  surf.d2zdy2 = d2zdl2*yy + dzdl*d2ldy2;
  surf.d2zdxdy = d2zdl2*xy + dzdl*d2ldxdy;
  return surf;
}

// const check = function(x,y) {
//   let dx = 0.01;
//   let x0 = sigmoid(x-dx, y, 50);
//   let x1 = sigmoid(x+dx, y, 50);
//   let y0 = sigmoid(x, y-dx, 50);
//   let y1 = sigmoid(x, y+dx, 50);
//   console.log('dzdx',x0.dzdx,(x1.z-x0.z)/2/dx,'d2zdx2',x0.d2zdx2,(x1.dzdx-x0.dzdx)/2/dx);
//   console.log('dzdy',x0.dzdy,(y1.z-y0.z)/2/dx,'d2zdy2',x0.d2zdy2,(y1.dzdy-y0.dzdy)/2/dx);
//   console.log('d2zdxdy',(x1.dzdy-x0.dzdy)/2/dx,(y1.dzdx-y0.dzdx)/2/dx)
// }
// check(20,10)
// check(-10,20)

export function derivatives(x, y, parameters) {
  // parameters has "waves" and "arena_radius"
    var z = 0, dzdx = 0, dzdy = 0, d2zdx2 = 0, d2zdy2 = 0, d2zdxdy = 0;
    // let sig = {z:1,dzdx:0,dzdy:0,d2zdx2:0,d2zdy2:0,d2zdxdy:0}; 
    let sig = sigmoid(x, y, parameters.arena_radius);
    for (let ii = 0; ii < parameters.waves.length; ii++) {
      // Length along wave ii (normalized to wavelength)
      // Each wave has [amplitude, wavelength, direction, phase]
      var amp = parameters.waves[ii].amplitude;
      var wvl = parameters.waves[ii].wavelength;
      var phi = parameters.waves[ii].azimuth;
      var psi = parameters.waves[ii].phase;
      var cq = Math.cos(phi);
      var sq = Math.sin(phi);
      var L = (x*cq + y*sq)/wvl;  var dLdx = cq/wvl;      var dLdy = sq/wvl;
      var d2Ldx2 = 0, d2Ldy2 = 0, d2Ldxdy = 0;
      var q = L*twopi+psi;        var dqdx = dLdx*twopi;  var dqdy = dLdy*twopi;
      var d2qdx2 = d2Ldx2*twopi, d2qdy2 = d2Ldy2*twopi, d2qdxdy = d2Ldxdy*twopi;
      var cq_ = Math.cos(q);
      var sq_ = Math.sin(q);
      z = z + sig.z*amp*cq_;
      dzdx += -sig.z*amp*dqdx*sq_ + amp*cq_*sig.dzdx;
      dzdy += -sig.z*amp*dqdy*sq_ + amp*cq_*sig.dzdy;
      d2zdx2 += -sig.z*amp*(d2qdx2*sq_ + dqdx*cq_*dqdx) - amp*dqdx*sq_*sig.dzdx + amp*cq_*sig.d2zdx2;
      d2zdy2 += -sig.z*amp*(d2qdy2*sq_ + dqdy*cq_*dqdy) - amp*dqdy*sq_*sig.dzdy + amp*cq_*sig.d2zdy2;
      d2zdxdy += -sig.z*amp*(d2qdxdy*sq_ + dqdy*cq_*dqdx) - amp*sq_*sig.dzdx*sig.dzdy;
    }
    return {z:z, dzdx:dzdx, dzdy:dzdy, d2zdx2:d2zdx2, d2zdy2:d2zdy2, d2zdxdy:d2zdxdy};
}

export function generate(seed, arena_radius, maxamp) {
   // A seeded RNG (same results for = values of gridd)
  let rand = get_RNG(''+seed);
  var waves = [];
  for (var ii = 0;  ii < 10 && maxamp > 0; ii++) {
    var amp = maxamp*rand();
    var wvl = Math.max(0.1,rand())*arena_radius;
    var phi = Math.PI*rand();
    var psi = Math.PI*rand();
    waves.push({'amplitude':amp,'wavelength':wvl,'azimuth':phi,'phase':psi});
  }
  return {arena_radius:arena_radius, waves:waves};
}

export function geometry(parameters, nfacets) {
  let gridd = parameters.arena_radius;
  let heightf = function(x, y) {
    var ztarget = 0;
    let sig = sigheight(x, y, gridd);
    for (var ii = 0; ii < parameters.waves.length; ii++) {
      // Length along wave ii (normalized to wavelength)
      // Each wave has [amplitude, wavelength, direction, phase]
      var amp = parameters.waves[ii].amplitude;
      var wvl = parameters.waves[ii].wavelength;
      var phi = parameters.waves[ii].azimuth;
      var psi = parameters.waves[ii].phase
      var cq = Math.cos(phi);
      var sq = Math.sin(phi);
      var L = (x*cq + y*sq)/wvl;
      var q = L*2*Math.PI+psi;
      ztarget = ztarget + sig*amp*Math.cos(q);
    }
    return ztarget;
  };

  let filterf = function(x0, y0, x1, y1) {
    return Math.min( Math.sqrt(x0*x0+y0*y0) , 
      Math.sqrt(x1*x1+y1*y1) , 
      Math.sqrt(x0*x0+y1*y1) ,
      Math.sqrt(x1*x1+y0*y0)) < gridd;
  };

  let n = Math.max(2, Math.min(200, nfacets));
  let g = grid_surface(-gridd, gridd, -gridd, gridd, n, n, heightf, filterf);

  g.normal = [];
  for (var ii = 0; ii < g.vertices.length/3; ii++) {
    let z = derivatives(g.vertices[ii*3], g.vertices[ii*3+1], parameters);
    g.normal.push(-z.dzdx/n, -z.dzdy/n, 1/n);
  }
  return g;
};
