import * as THREE from "three";
import { Scene } from "./Engine/Scene";

export class Lights {
  public ambientLight: THREE.AmbientLight;
  public directionalLight: THREE.DirectionalLight;

  constructor(scene: Scene) {
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    this.directionalLight.position.set(5, 10, 15);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 50;
    scene.add(this.directionalLight);

    this.ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(this.ambientLight);
  }
}
