import RAPIER from "@dimforge/rapier3d-compat";
await RAPIER.init();
const world = new RAPIER.World({x:0,y:-9.81,z:0});
world.timestep = 1/60;
const body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(0,0,0).setGravityScale(0).setCanSleep(false));
world.createCollider(RAPIER.ColliderDesc.cuboid(0.8,0.4,2).setMassProperties(895,{x:0,y:0.4,z:0},{x:1300,y:1250,z:350},{x:0,y:0,z:0,w:1}), body);
for (let i=0;i<60;i++){
  body.resetForces(false);
  body.addForce({x:1000,y:0,z:0}, true);
  world.step();
}
console.log("pos", body.translation(), "vel", body.linvel());
world.free();
