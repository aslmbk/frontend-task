import * as THREE from "three";
import { World } from "./World";

export class CheckDistance {
  private world: World;
  private active: boolean = false;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  private hoverSphere: THREE.Mesh | null = null;
  private point1: THREE.Vector3 | null = null;
  private point2: THREE.Vector3 | null = null;
  private point1Marker: THREE.Mesh | null = null;
  private point2Marker: THREE.Mesh | null = null;
  private connectionLine: THREE.Line | null = null;

  // Materials
  private hoverMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.5,
  });
  private selectedMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
  });
  private lineMaterialHover = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.5,
  });
  private lineMaterialSelected = new THREE.LineBasicMaterial({
    color: 0xffffff,
  });

  constructor() {
    this.world = World.getInstance();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Create debug UI
    const debugFolder = this.world.debug.panel.addFolder({
      title: "Check Distance",
    });

    debugFolder
      .addBinding({ active: this.active }, "active", {
        label: "Check distance",
      })
      .on("change", (ev) => {
        this.setActive(ev.value);
      });

    // Add event listeners
    window.addEventListener("mousemove", this.onMouseMove.bind(this));
    window.addEventListener("click", this.onClick.bind(this));

    // Add update to animation loop
    this.world.time.events.on("tick", () => {
      this.update();
    });
  }

  private setActive(value: boolean): void {
    this.active = value;

    if (!this.active) {
      this.reset();
    }
  }

  private reset(): void {
    // Remove all visual elements
    if (this.hoverSphere) {
      this.world.scene.remove(this.hoverSphere);
      this.hoverSphere = null;
    }

    if (this.point1Marker) {
      this.world.scene.remove(this.point1Marker);
      this.point1Marker = null;
    }

    if (this.point2Marker) {
      this.world.scene.remove(this.point2Marker);
      this.point2Marker = null;
    }

    if (this.connectionLine) {
      this.world.scene.remove(this.connectionLine);
      this.connectionLine = null;
    }

    this.point1 = null;
    this.point2 = null;
  }

  private onMouseMove(event: MouseEvent): void {
    if (!this.active) return;

    // Calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    const rect = this.world.renderer.getDomElement().getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private onClick(): void {
    if (!this.active || !this.hoverSphere) return;

    if (this.point1 === null) {
      // Set first point
      this.point1 = this.hoverSphere.position.clone();
      this.point1Marker = this.createMarkerSphere(
        this.point1,
        this.selectedMaterial
      );
      this.world.scene.add(this.point1Marker);
    } else if (this.point2 === null) {
      // Set second point
      this.point2 = this.hoverSphere.position.clone();
      this.point2Marker = this.createMarkerSphere(
        this.point2,
        this.selectedMaterial
      );
      this.world.scene.add(this.point2Marker);

      // Update connection line with selected material
      if (this.connectionLine) {
        this.world.scene.remove(this.connectionLine);
      }
      this.connectionLine = this.createConnectionLine(
        this.point1,
        this.point2,
        this.lineMaterialSelected
      );
      this.world.scene.add(this.connectionLine);

      // Display distance in debug panel
      const distance = this.point1.distanceTo(this.point2);
      console.log(`Distance: ${distance.toFixed(3)} units`);
    } else {
      // Reset and start over if both points are already set
      this.reset();
    }
  }

  private update(): void {
    if (!this.active) return;

    // Update raycaster with current mouse position
    this.raycaster.setFromCamera(this.mouse, this.world.view.camera);

    // Calculate objects intersecting the ray
    const intersects = this.raycaster.intersectObjects(
      this.world.scene.getScene().children,
      true
    );

    // Handle hover sphere
    if (intersects.length > 0) {
      const intersection = intersects[0];

      // Create or update hover sphere
      if (!this.hoverSphere) {
        this.hoverSphere = this.createMarkerSphere(
          intersection.point,
          this.hoverMaterial
        );
        this.world.scene.add(this.hoverSphere);
      } else {
        this.hoverSphere.position.copy(intersection.point);
      }

      // Update connection line if first point is set
      if (this.point1 !== null && this.point2 === null) {
        if (this.connectionLine) {
          this.world.scene.remove(this.connectionLine);
        }
        this.connectionLine = this.createConnectionLine(
          this.point1,
          intersection.point,
          this.lineMaterialHover
        );
        this.world.scene.add(this.connectionLine);
      }
    } else {
      // Remove hover sphere if no intersection
      if (this.hoverSphere) {
        this.world.scene.remove(this.hoverSphere);
        this.hoverSphere = null;
      }

      // Remove connection line if no intersection and second point not set
      if (this.connectionLine && this.point2 === null) {
        this.world.scene.remove(this.connectionLine);
        this.connectionLine = null;
      }
    }
  }

  private createMarkerSphere(
    position: THREE.Vector3,
    material: THREE.Material
  ): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(0.1, 16, 16);
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.copy(position);
    return sphere;
  }

  private createConnectionLine(
    from: THREE.Vector3,
    to: THREE.Vector3,
    material: THREE.LineBasicMaterial
  ): THREE.Line {
    const geometry = new THREE.BufferGeometry().setFromPoints([from, to]);
    return new THREE.Line(geometry, material);
  }

  public dispose(): void {
    // Clean up event listeners
    window.removeEventListener("mousemove", this.onMouseMove.bind(this));
    window.removeEventListener("click", this.onClick.bind(this));

    // Clean up scene objects
    this.reset();
  }
}
