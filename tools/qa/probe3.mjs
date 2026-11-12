import RAPIER from "@dimforge/rapier3d-compat";
await RAPIER.init();
const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
world.timestep = 1/60;
const ground = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0,-1,0));
world.createCollider(RAPIER.ColliderDesc.cuboid(200,1,200), ground);
const body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(0,0.18,0).setCanSleep(false));
world.createCollider(RAPIER.ColliderDesc.cuboid(0.77,0.317,1.92).setTranslation(0,0.605,0).setMassProperties(895,{x:0,y:-0.085,z:0.258},{x:1300,y:1250,z:350},{x:0,y:0,z:0,w:1}), body);
const v = world.createVehicleController(body);
for (let i=0;i<4;i++){
  const z = i<2 ? 1.171 : -1.171;
  const x = i%2===0 ? -0.695 : 0.695;
  v.addWheel({x,y:0.3745,z},{x:0,y:-1,z:0},{x:1,y:0,z:0},0.2,0.286);
}
for (let i=0;i<4;i++){
  v.setWheelSuspensionStiffness(i, 26.8);
  v.setWheelSuspensionCompression(i, 2.35);
  v.setWheelSuspensionRelaxation(i, 2.35);
  v.setWheelMaxSuspensionTravel(i, 0.17);
  v.setWheelMaxSuspensionForce(i, 19300);
  v.setWheelFrictionSlip(i, 1);
}
for (let i=0;i<300;i++){ v.updateVehicle(1/60); world.step(); }
const t = body.translation();
console.log("body y", t.y.toFixed(4));
console.log("hardPoint", v.wheelHardPoint(0)?.y?.toFixed(4));
console.log("conn", v.wheelChassisConnectionPointCs(0)?.y?.toFixed(4));
console.log("suspLen", v.wheelSuspensionLength(0)?.toFixed(4));
console.log("contact", v.wheelContactPoint(0)?.y?.toFixed(4));
console.log("wheel center implied", ((v.wheelHardPoint(0)?.y ?? 0) - (v.wheelSuspensionLength(0) ?? 0)).toFixed(4));
console.log("fz", v.wheelSuspensionForce(0)?.toFixed(0));
world.free();
