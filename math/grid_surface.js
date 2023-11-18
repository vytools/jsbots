const addh = function(x,y,heightf,vertices) {
  vertices.push(x,y,heightf(x,y));
}

export function grid_surface(xmin, xmax, ymin, ymax, nx, ny, heightf, filterf) {
  let vertices = [];
  let indices = [];
  let uvs = [];
  let yspc = (ymax-ymin)/ny;
  let xspc = (xmax-xmin)/nx;
  let NUV = 1;
  for (let r = 0; r < ny; r++) {
    let y = ymin+r*yspc;
    for (let c = 0; c < nx; c++) {
      let x = xmin+c*xspc;
      if ((!filterf) || filterf(x, y, x+xspc, y+yspc)) {
        let n = vertices.length/3; // unique vertices per facet required because of uvmapping
        addh(x, y, heightf, vertices);
        addh(x+xspc, y, heightf, vertices);
        addh(x+xspc, y+yspc, heightf, vertices);
        addh(x, y+yspc, heightf, vertices);
        let u0 = (c % NUV)/NUV, u1 = u0+1/NUV;
        let v0 = (r % NUV)/NUV, v1 = v0+1/NUV;
        uvs.push(u0,v0,u1,v0,u1,v1,u0,v1);
        indices.push(n,n+1,n+2, n+2,n+3,n);
      }
    }
  }
  return {indices:indices, vertices:vertices, uvs:uvs};
}