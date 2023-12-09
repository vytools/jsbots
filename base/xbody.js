export function make_dof(dofp, name) {
  var sufx = ['_tx','_ty','_tz','_rz','_ry','_rx'];
  var axis = [[1,0,0],[0,1,0],[0,0,1],[0,0,1],[0,1,0],[1,0,0]];
  var ii = -1;
  return dofp.map(function(dofp_) {
      ii++;
      return {'name':name+sufx[ii],'axis':axis[ii],'rotation':ii>2,'position':dofp_};
  }).filter(function(dofp_) {
      return dofp_.position !== null;
  });
};

export function make_body(origin, rotation, com, inertia, name, parent, renderi) {
  var x = {
      type:'xbody',
      name:name,
      parent:parent,
      rxyz:rotation,
      txyz:origin,
      dof:[],
      com:[com.x, com.y, com.z],
      mass:inertia.mass || 1,
      Ixx:inertia.Ixx || 1,
      Iyy:inertia.Iyy || 1,
      Izz:inertia.Izz || 1, 
      Ixy:inertia.Ixy || 0,
      Izx:inertia.Izx || 0,
      Iyz:inertia.Iyz || 0,
      renderinertia:renderi
  };
  return x;  
};

let render_inertia = function (XTHREE,xbody) {
  if (!XTHREE || !XTHREE.scene) return;
  if (!(xbody.hasOwnProperty('mass') && xbody.type == 'xbody' &&
    xbody.renderinertia && xbody.hasOwnProperty('inertia') && 
    xbody.hasOwnProperty('com'))) return;
  var mass = xbody.mass;
  if (mass <= 0) return;
  var inertia = new THREE.Matrix4().set(xbody.Ixx,xbody.Ixy,xbody.Izx, 0, 
    xbody.Ixy,xbody.Iyy,xbody.Iyz, 0,   xbody.Izx,xbody.Iyz,xbody.Izz, 0,    0, 0, 0, 1);
  var t = new THREE.Vector3();
  var q = new THREE.Quaternion();
  var s = new THREE.Vector3(0,0,0);
  inertia.decompose(t, q, s);
  var scale = new THREE.Vector3(Math.sqrt((s.z + s.y - s.x)*2.5/mass),
                                Math.sqrt((s.x + s.z - s.y)*2.5/mass),
                                Math.sqrt((s.y + s.x - s.z)*2.5/mass));
  var geometry = new THREE.SphereGeometry( 1.0, 18, 12 );
  var center = new THREE.Vector3(xbody.com[0], xbody.com[1], xbody.com[2]);
  var R = new THREE.Matrix4().compose(center, q, scale);
  R.premultiply(xbody.R);
  geometry.applyMatrix4( R );
  var material = new THREE.MeshNormalMaterial(
    {transparent:true, opacity:0.4, depthTest:true,depthWrite:true});
  var mesh = new THREE.Mesh( geometry, material );
  mesh.userData.xbody = xbody.name;
  mesh.name = xbody.name + 'inertia'
  XTHREE.scene.add(mesh);
};
  
let xtransform = function(xbody, currentState) {
  // xbody = {name:'bodyB',parent:'bodyA',xyz:[0,0,0],dof:[
  // {name:'bodyBrz',axis:[0,0,1],position:1,rotation:true}
  //]}
  // All translations are done first, then rotations in the order listed in 'dof'
  var translate = new THREE.Vector3(0,0,0);
  var rotate = new THREE.Quaternion(0,0,0,1);
  if (xbody && xbody.txyz) {
    translate.setX(xbody.txyz.x);
    translate.setY(xbody.txyz.y);
    translate.setZ(xbody.txyz.z);
  }
  if (xbody && xbody.rxyz) {
    rotate.setFromEuler(new THREE.Euler( xbody.rxyz.x, xbody.rxyz.y, xbody.rxyz.z, 'XYZ' ));
  }
  if (xbody && xbody.dof) {
    xbody.dof.forEach(function(dof) { // dof.axis BETTER BE ALREADY NORMALIZED!!!
      var position = (currentState && currentState[dof.name]) ? currentState[dof.name] : dof.position;
      currentState[dof.name] = position;
      if (dof.rotation) {
        var cx = Math.cos(position/2);
        var sx = Math.sin(position/2);
        rotate.multiply(new THREE.Quaternion(sx*dof.axis[0],sx*dof.axis[1],sx*dof.axis[2],cx));
      } else {
        translate.addScaledVector(new THREE.Vector3(dof.axis[0], dof.axis[1], dof.axis[2]), position);
      }
    });
  }
  var local = new THREE.Matrix4();
  local.compose(translate, rotate, new THREE.Vector3(1,1,1));
  return local;
  //if (xbody.hasOwnProperty('scale')) transform.scale = xbody.scale.join(',');
};

export function l2g(v,R) {
    if (!R) return null;
    return v.clone().applyMatrix4(R);
};
  
export function v2g(v,R) {
    if (!R) return null;
    return v.clone().applyMatrix3( new THREE.Matrix3().setFromMatrix4(R) );
};
  
export function g2l(v,R) {
    if (!R) return null;
    return v.clone().subtract( new THREE.Vector3.setFromMatrixPosition(R) )
      .applyMatrix3( new THREE.Matrix3().setFromMatrix4(R.clone().transpose()) );
    //return (R) ? R.transpose().multMatrixVec(w.subtract(R.e3())) : null;
};
  
export function g2v(v,R) {
    if (!R) return null;
    return v.clone().applyMatrix3( new THREE.Matrix3().setFromMatrix4(R.clone().transpose()) );
    //return (R) ? R.transpose().multMatrixVec(w) : null; 
};
  
export function dispose(XTHREE) {
    //https://stackoverflow.com/questions/33152132/three-js-collada-whats-the-proper-way-to-dispose-and-release-memory-garbag/33199591#33199591
    if (!XTHREE || !XTHREE.scene) return;
    for (var ii=XTHREE.scene.children.length-1; ii>=0; ii--) {
      var node = XTHREE.scene.children[ii];
      if (node instanceof THREE.Mesh) {
          if (node.geometry) {
              node.geometry.dispose();
          }
          if (node.material) {
              if (node.material instanceof THREE.MeshFaceMaterial || node.material instanceof THREE.MultiMaterial) {
                  node.material.materials.forEach(function (mtrl, idx) {
                      if (mtrl.map) mtrl.map.dispose();
                      if (mtrl.lightMap) mtrl.lightMap.dispose();
                      if (mtrl.bumpMap) mtrl.bumpMap.dispose();
                      if (mtrl.normalMap) mtrl.normalMap.dispose();
                      if (mtrl.specularMap) mtrl.specularMap.dispose();
                      if (mtrl.envMap) mtrl.envMap.dispose();
                      mtrl.dispose();    // disposes any programs associated with the material
                  });
              }
              else {
                  if (node.material.map) node.material.map.dispose();
                  if (node.material.lightMap) node.material.lightMap.dispose();
                  if (node.material.bumpMap) node.material.bumpMap.dispose();
                  if (node.material.normalMap) node.material.normalMap.dispose();
                  if (node.material.specularMap) node.material.specularMap.dispose();
                  if (node.material.envMap) node.material.envMap.dispose();
                  node.material.dispose();   // disposes any programs associated with the material
              }
          }
          XTHREE.scene.remove(node);
      }
    }
};
  
export function set_state(XBODIES, XTHREE, state) {
    var RxR = {'ground' : new THREE.Matrix4()}; // incremental tranformation from "last state" to "state"
    for (var ii=0; ii<XBODIES.__list__.length; ii++) {
      var name = XBODIES.__list__[ii];
      var Rx = xtransform(XBODIES[name], state);
      var Rp = XBODIES[XBODIES[name].parent].R;
      RxR[name] = new THREE.Matrix4()
        .extractRotation(XBODIES[name].R.clone().transpose());
      RxR[name].setPosition(new THREE.Vector3()
        .setFromMatrixPosition(XBODIES[name].R)
        .negate().applyMatrix4(RxR[name]));
        XBODIES[name].R = new THREE.Matrix4().multiplyMatrices(Rp, Rx);
      RxR[name].premultiply(XBODIES[name].R);
    }

    if (XTHREE && XTHREE.scene) {
      for (var ii = XTHREE.scene.children.length-1; ii>=0; ii--) {
        var node = XTHREE.scene.children[ii];
        if (node.userData && node.userData.hasOwnProperty('xbody')) {
          if (node.type == 'SpotLight') {
            let R = XBODIES[node.userData.xbody].R;
            let pos = l2g(new THREE.Vector3(0, 0, 0), R);
            let la = v2g(new THREE.Vector3( 10, 0, 0 ), R);
            node.position.set(pos.x, pos.y, pos.z);
            node.target.position.x = pos.x + la.x;
            node.target.position.y = pos.y + la.y;
            node.target.position.z = pos.z + la.z;
            node.target.updateMatrixWorld()
          } else {
            node.applyMatrix4( RxR[node.userData.xbody] );
            node.verticesNeedUpdate = true;
          }
        }
      }
    }
    
}
  
export function init(XBODIES, XTHREE) {
    XBODIES.__list__ = [];
    XBODIES.ground = {name:'ground', R:new THREE.Matrix4()};
    var body_linking = function(parent) {
      let names = Object.keys(XBODIES);
      for (var ii = 0; ii < names.length; ii++) {
        if (XBODIES[names[ii]].type == 'xbody' && XBODIES[names[ii]].parent == parent && XBODIES.__list__.indexOf(names[ii]) == -1) {
          XBODIES[names[ii]].name = names[ii];
          XBODIES[names[ii]].R = new THREE.Matrix4();
          XBODIES.__list__.push(names[ii]);
          body_linking(names[ii]);
        }
      }
    }
    body_linking('ground');
    // dispose(xthree);  return;
    set_state(XBODIES, XTHREE, {});
    for (var ii=0; ii<XBODIES.__list__.length; ii++) {
      var xbody = XBODIES[XBODIES.__list__[ii]];
      render_inertia(XTHREE, xbody);
    }
}
