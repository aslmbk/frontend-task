import * as THREE from "three";
import CC from "camera-controls";

CC.install({ THREE });

export class CameraControls {
  private controls: CC;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLCanvasElement) {
    this.controls = new CC(camera, domElement);
    this.controls.dollyToCursor = true;
    this.controls.dollySpeed = 0.4;
    this.controls.draggingSmoothTime = 0;
    this.controls.smoothTime = 0;
    this.controls.mouseButtons.right = CC.ACTION.ROTATE;
    this.controls.mouseButtons.left = CC.ACTION.NONE;
  }

  public fitToBox(box: THREE.Box3, fitIn: boolean) {
    this.controls.fitToBox(box, fitIn);
  }

  public dispose() {
    this.controls.dispose();
  }

  public update(delta: number) {
    this.controls.update(delta);
  }
}
