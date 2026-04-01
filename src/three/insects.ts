import * as THREE from "three";

/**
 * Cria partículas animadas representando pequenos vagalumes fantasmas (insects).
 * Retorna uma função `updateInsects(time)` que deve ser chamada no ciclo 
 * principal de renderização.
 */
export function createInsects(scene: THREE.Scene, count: number = 40) {
  const group = new THREE.Group();
  
  // Geometria super simples e material que emite luz própria
  const geo = new THREE.SphereGeometry(0.04, 8, 8);
  const mat = new THREE.MeshBasicMaterial({ color: 0xaaff88 }); // Verde-fantasma

  const insects: { 
    mesh: THREE.Mesh; 
    basePath: THREE.Vector3; 
    speed: number; 
    phaseX: number; 
    phaseY: number; 
    phaseZ: number; 
  }[] = [];

  for (let i = 0; i < count; i++) {
    const mesh = new THREE.Mesh(geo, mat);
    
    // Distribui os vagalumes de forma esférica ou retangular pelo meio do cemitério
    const x = (Math.random() - 0.5) * 40;
    const y = 0.5 + Math.random() * 3.0; // Um pouco acima do chão
    const z = (Math.random() - 0.5) * 35 - 5; 
    
    mesh.position.set(x, y, z);
    group.add(mesh);

    // Adiciona entropia e velocidades diferentes para não parecer algo mecânico
    insects.push({
      mesh,
      basePath: new THREE.Vector3(x, y, z),
      speed: 0.5 + Math.random() * 1.5,
      phaseX: Math.random() * Math.PI * 2,
      phaseY: Math.random() * Math.PI * 2,
      phaseZ: Math.random() * Math.PI * 2,
    });
  }

  scene.add(group);

  // Fecha o escopo e retorna a função de atualizar os objetos diretamente
  return function updateInsects(time: number) {
    for (const bug of insects) {
      const t = time * bug.speed;
      // Ondas com frequências primas para o voo não repetir padrões rapidamente
      bug.mesh.position.x = bug.basePath.x + Math.sin(t * 2.1 + bug.phaseX) * 0.8;
      bug.mesh.position.y = bug.basePath.y + Math.sin(t * 3.4 + bug.phaseY) * 0.4;
      bug.mesh.position.z = bug.basePath.z + Math.cos(t * 2.7 + bug.phaseZ) * 0.8;
    }
  };
}
