import * as THREE from "three";

export class CheckDistance {
  private active: boolean = false;
  private frameFilter = 3;
  private frameCount = 0;

  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private container: HTMLCanvasElement;
  private raycaster: THREE.Raycaster;
  private group: THREE.Group;

  private hoverMaterial = new THREE.MeshBasicMaterial({
    color: 0xff00ff,
    opacity: 0.5,
    transparent: true,
  });
  private selectedMaterial = new THREE.MeshBasicMaterial({ color: 0xff00ff });
  private point1: THREE.Mesh;
  private point2: THREE.Mesh;
  private line: THREE.Line | null = null;
  private lineMaterialHovered = new THREE.LineBasicMaterial({
    color: 0xcc00cc,
  });
  private lineMaterialSelected = new THREE.LineBasicMaterial({
    color: 0xff00ff,
  });

  private mouse = new THREE.Vector2();

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    container: HTMLCanvasElement
  ) {
    this.scene = scene;
    this.camera = camera;
    this.container = container;
    this.raycaster = new THREE.Raycaster();
    this.group = new THREE.Group();

    this.scene.add(this.group);

    const geometry = new THREE.SphereGeometry(0.02, 32, 32);
    this.point1 = new THREE.Mesh(geometry, this.hoverMaterial);
    this.point2 = new THREE.Mesh(geometry, this.hoverMaterial);
    this.point1.name = "distance-point-1";
    this.point2.name = "distance-point-2";
    this.point1.userData.active = false;
    this.point2.userData.active = false;
    this.point1.userData.hovered = false;
    this.point2.userData.hovered = false;
    this.point1.visible = false;
    this.point2.visible = false;
    this.group.add(this.point1);
    this.group.add(this.point2);

    this.container.addEventListener("mousemove", this.mouseMove.bind(this));
    this.container.addEventListener("click", this.click.bind(this));
  }

  private mouseMove(event: MouseEvent) {
    if (
      !this.active ||
      (this.point1.userData.active && this.point2.userData.active)
    ) {
      return;
    }
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private click() {
    if (
      !this.active ||
      (this.point1.userData.active && this.point2.userData.active)
    ) {
      return;
    }
    if (!this.point1.userData.active && this.point1.userData.hovered) {
      this.setPointActive(this.point1);
    } else if (!this.point2.userData.active && this.point2.userData.hovered) {
      this.setPointActive(this.point2);
      this.createConnectionLine(
        this.point1.position,
        this.point2.position,
        this.lineMaterialSelected
      );
      console.log(
        this.point1.position.distanceTo(this.point2.position).toFixed(2) +
          " meters"
      );
    }
  }

  public activate() {
    this.active = true;
  }

  public deactivate() {
    this.active = false;
    this.point1.visible = false;
    this.point2.visible = false;
    this.point1.userData.active = false;
    this.point2.userData.active = false;
    this.point1.userData.hovered = false;
    this.point2.userData.hovered = false;
    this.removeConnectionLine();
  }

  public update() {
    if (
      !this.active ||
      (this.point1.userData.active && this.point2.userData.active)
    ) {
      return;
    }
    this.frameCount++;
    if (this.frameCount < this.frameFilter) return;
    this.frameCount = 0;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster
      .intersectObjects(this.scene.children)
      .filter(
        (intersect) =>
          intersect.object.name !== "distance-point-1" &&
          intersect.object.name !== "distance-point-2" &&
          intersect.object.name !== "distance-line"
      );
    if (intersects.length > 0) {
      const intersect = intersects[0];
      if (!this.point1.userData.active) {
        this.setPointHovered(this.point1, intersect);
      } else if (!this.point2.userData.active) {
        this.setPointHovered(this.point2, intersect);
        this.createConnectionLine(
          this.point1.position,
          this.point2.position,
          this.lineMaterialHovered
        );
      }
    } else {
      this.removeConnectionLine();
      this.setPointUnhovered(this.point1);
      this.setPointUnhovered(this.point2);
    }
  }

  private createConnectionLine(
    from: THREE.Vector3,
    to: THREE.Vector3,
    material: THREE.LineBasicMaterial
  ) {
    this.removeConnectionLine();
    const geometry = new THREE.BufferGeometry().setFromPoints([from, to]);
    this.line = new THREE.Line(geometry, material);
    this.line.name = "distance-line";
    this.group.add(this.line);
  }

  private removeConnectionLine() {
    if (this.line) {
      this.line.geometry.dispose();
      this.group.remove(this.line);
      this.line = null;
    }
  }

  private setPointHovered(point: THREE.Mesh, intersect: THREE.Intersection) {
    point.visible = true;
    point.material = this.hoverMaterial;
    point.userData.active = false;
    point.userData.hovered = true;
    point.position.set(intersect.point.x, intersect.point.y, intersect.point.z);
  }

  private setPointUnhovered(point: THREE.Mesh) {
    if (point.userData.active) return;
    point.visible = false;
    point.userData.hovered = false;
  }

  private setPointActive(point: THREE.Mesh) {
    point.visible = true;
    point.material = this.selectedMaterial;
    point.userData.active = true;
    point.userData.hovered = false;
  }
}
