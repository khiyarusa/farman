import RAPIER from '@dimforge/rapier3d-compat';

await RAPIER.init();

const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
world.timestep = 1 / 60;
world.numSolverIterations = 6;

const ground = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, -1, 0));
world.createCollider(RAPIER.ColliderDesc.cuboid(200, 1, 200), ground);

// Exact FARMAN Pride 131 parameters.
const mass = 895;
const W = 1.605;
const H = 1.441;
const L = 3.942;
const boxHalfHeight = H * 0.22;
const boxY = H * 0.42;
const radius = 0.286;
const restLength = 0.2;
const frontShare = 0.61;

const body = world.createRigidBody(
  RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(0, 0.1786, 0)
    .setLinearDamping(0.04)
    .setAngularDamping(0.35)
    .setCcdEnabled(true)
    .setCanSleep(false),
);

world.createCollider(
  RAPIER.ColliderDesc.cuboid(W / 2 - 0.03, boxHalfHeight, L / 2 - 0.05)
    .setTranslation(0, boxY, 0)
    .setMassProperties(
      mass,
      { x: 0, y: 0.52 - boxY, z: 2.342 * (frontShare - 0.5) },
      { x: (mass / 12) * (L * L + H * H), y: 1250, z: (mass / 12) * (W * W + H * H) },
      { x: 0, y: 0, z: 0, w: 1 },
    )
    .setFriction(0.55)
    .setRestitution(0.12),
  body,
);

const vehicle = world.createVehicleController(body);
const frontComp = (mass * 9.81 * frontShare) / 2 / 24000;
const rearComp = (mass * 9.81 * (1 - frontShare)) / 2 / 20000;
const connF = radius + restLength - frontComp;
const connR = radius + restLength - rearComp;

const anchors = [
  [-0.695, connF, 1.171],
  [0.695, connF, 1.171],
  [-0.675, connR, -1.171],
  [0.675, connR, -1.171],
];
const front = [24000, 20000];
for (let i = 0; i < 4; i++) {
  const a = anchors[i];
  vehicle.addWheel({ x: a[0], y: a[1], z: a[2] }, { x: 0, y: -1, z: 0 }, { x: 1, y: 0, z: 0 }, restLength, radius);
  const isFront = i < 2;
  vehicle.setWheelSuspensionStiffness(i, (isFront ? front[0] : front[1]) / mass);
  vehicle.setWheelSuspensionCompression(i, 2100 / mass);
  vehicle.setWheelSuspensionRelaxation(i, 2100 / mass);
  vehicle.setWheelMaxSuspensionTravel(i, 0.17);
  vehicle.setWheelMaxSuspensionForce(i, mass * 9.81 * 2.2);
  vehicle.setWheelFrictionSlip(i, 1.0);
  vehicle.setWheelSideFrictionStiffness(i, 1);
}

console.log('mass', body.mass(), 'com', body.localCom());

for (let i = 0; i < 240; i++) {
  vehicle.updateVehicle(1 / 60);
  world.step();
  if (i % 40 === 0) {
    const t = body.translation();
    const fz = [];
    const len = [];
    for (let k = 0; k < 4; k++) {
      fz.push(Math.round(vehicle.wheelSuspensionForce(k) ?? -1));
      len.push((vehicle.wheelSuspensionLength(k) ?? -1).toFixed(3));
    }
    console.log(i, 'y', t.y.toFixed(3), 'fz', fz.join(','), 'len', len.join(','), 'sum', fz.reduce((a, b) => a + b, 0), 'weight', Math.round(body.mass() * 9.81));
  }
}

// Drive test with direct forces.
for (let i = 0; i < 120; i++) {
  vehicle.setWheelEngineForce(0, 3000);
  vehicle.setWheelEngineForce(1, 3000);
  vehicle.updateVehicle(1 / 60);
  world.step();
}
console.log('after drive pos', body.translation(), 'speed', vehicle.currentVehicleSpeed());
world.free();
