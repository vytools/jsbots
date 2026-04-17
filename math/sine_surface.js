import { RNG } from "https://cdn.jsdelivr.net/gh/vytools/vyjs@v4.0.5/js/rng.js";

const twopi = 2*Math.PI;

const WIDTH_FACTOR_1 = Math.pow(2*(0.975 - 0.5),2);
const WIDTH_FACTOR = Math.sqrt(WIDTH_FACTOR_1/(1-WIDTH_FACTOR_1));

const sigmoid = function(x, y, radius, width95) {
  let arg = x*x + y*y, dargdx = 2*x, dargdy = 2*y;
  if (arg < 0.001 || width95 <= 0) return {z:1,dzdx:0,dzdy:0,d2zdx2:0,d2zdy2:0,d2zdxdy:0};
  let a2 = Math.sqrt(arg);
  let l = radius - a2;
  let dldarg = -0.5/a2;
  let dldx = dldarg*dargdx, dldy = dldarg*dargdy;
  let m = WIDTH_FACTOR * 2 / width95;  // z = (l*m/sqrt(1+m*m)/2 + 0.5);
  let mm = m*m;
  let B = Math.sqrt(1.0 + mm*l*l);
  let dBdl = (mm*l)/B;
  let BB = B*B;
  let height = 1;
  let surf = {};
  surf.z = (height*m/2) * l / B  +  height * 0.5;
  let dzdl = (height*m/2) * (B - l*dBdl) / BB;
  surf.dzdx = dzdl*dldx;
  surf.dzdy = dzdl*dldy;
  return surf;
}

const derivatives = function(x, y, surface_features) {
  // parameters has "waves" and "sigmoid"
    var z = 0, dzdx = 0, dzdy = 0;
    // let sig = {z:1,dzdx:0,dzdy:0};
    let sig = sigmoid(x, y, surface_features.sigmoid_radius, surface_features.sigmoid_width95);
    surface_features.waves.forEach(w => {
      // Length along wave ii (normalized to wavelength)
      // Each wave has [amplitude, wavelength, direction, phase]
      var amp = w.amplitude;
      var wvl = w.wavelength;
      var phi = w.azimuth;
      var psi = w.phase;
      var cq = Math.cos(phi);
      var sq = Math.sin(phi);
      var L = (x*cq + y*sq)/wvl;  var dLdx = cq/wvl;      var dLdy = sq/wvl;
      var q = L*twopi+psi;        var dqdx = dLdx*twopi;  var dqdy = dLdy*twopi;
      var cq_ = Math.cos(q);
      var sq_ = Math.sin(q);
      z = z + sig.z*amp*cq_;
      dzdx += -sig.z*amp*dqdx*sq_ + amp*cq_*sig.dzdx;
      dzdy += -sig.z*amp*dqdy*sq_ + amp*cq_*sig.dzdy;
    });
    return {z:z, dzdx:dzdx, dzdy:dzdy};
}

export function generate(seed, arena_radius, maxamp) {
   // A seeded RNG (same results for = values of gridd)
  let rand = RNG(''+seed);
  var waves = [];
  for (var ii = 0;  ii < 10 && maxamp > 0; ii++) {
    var amp = maxamp*rand();
    var wvl = Math.max(0.1,rand())*arena_radius;
    var phi = Math.PI*rand();
    var psi = Math.PI*rand();
    waves.push({amplitude:amp, wavelength:wvl, azimuth:phi, phase:psi});
  }
  return {
    sigmoid_radius:arena_radius/2, 
    sigmoid_width95:3*arena_radius/4, 
    waves:waves
  };
}

export function geometry(arena_radius_m, surface_features, nfacets) {
  let n = Math.max(2, Math.min(200, nfacets));
  let data = {hdata:[],n,arena_radius_m,derivatives:(x,y)=>{ return derivatives(x,y,surface_features); }};
  let spc = (2*arena_radius_m)/(data.n-1);
  for (let r = 0; r < n; r++) {
    let y = -arena_radius_m+r*spc;
    for (let c = 0; c < n; c++) {
      let z = derivatives(-arena_radius_m+c*spc,y,surface_features).z;
      data.hdata.push(z);
    }
  }
  return data;
};
