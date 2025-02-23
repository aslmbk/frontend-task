import * as THREE from "three";
import axios from "axios";
import parseJSON, { findThreeJSJSON } from "../utils/parse-json";
import * as uuid from "uuid";
import * as RX from "rxjs";
import { CameraControls } from "./CameraControls";
import { Lights } from "./Lights";
import { World } from "./Engine/World";

export type ViewerStatus = "loading" | "error" | "idle";
export type ModelType = THREE.Object3D | null;

class Viewer {
  private id: string;
  private cameraControl: CameraControls;
  private lights: Lights;
  private world: World;
  public model = new RX.BehaviorSubject<ModelType>(null);

  private cursor: THREE.Mesh;

  public status = new RX.BehaviorSubject<ViewerStatus>("idle");

  private originalMaterials = new Map<
    THREE.Object3D,
    THREE.Material | THREE.Material[]
  >();
  private highlightMaterials: Record<string, THREE.MeshBasicMaterial> = {};

  constructor(container: HTMLDivElement) {
    this.id = uuid.v4();

    this.world = new World({ domElement: container });
    this.world.renderer.controlShadowMap(true, THREE.PCFSoftShadowMap);
    this.world.renderer.setClearColor(new THREE.Color("#333333"));
    this.world.view.camera.position.set(10, 10, 10);

    this.cameraControl = new CameraControls(
      this.world.view.camera,
      this.world.renderer.getDomElement()
    );

    this.lights = new Lights(this.world.scene);

    this.loadModel().then((object3d) => {
      if (object3d) {
        object3d.rotateX(-Math.PI / 2);
        this.world.scene.add(object3d);
        const boundingBox = new THREE.Box3().setFromObject(object3d);
        this.cameraControl.fitToBox(boundingBox, false);
        this.model.next(object3d);
        this.status.next("idle");
      }
    });

    this.cursor = new THREE.Mesh(
      new THREE.ConeGeometry(0.2, 0.5, 4),
      new THREE.MeshBasicMaterial({
        color: 0xffff3b,
        transparent: true,
        opacity: 0.5,
      })
    );
    this.cursor.visible = false;
    this.cursor.position.set(0, 2, 0);
    this.cursor.rotateX(-Math.PI);
    this.world.scene.add(this.cursor);

    this.world.time.events.on("tick", ({ delta, elapsed }) => {
      this.cameraControl.update(delta);
      this.cursor.position.y += Math.sin(elapsed) * 0.002;
    });
  }

  private async loadModel() {
    this.status.next("loading");

    try {
      const modelUrl =
        "https://storage.yandexcloud.net/lahta.contextmachine.online/files/pretty_ceiling_props.json";

      const response = await axios.get(modelUrl, {
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
      const data = response.data;

      const jsonObject = findThreeJSJSON(data);
      if (jsonObject) {
        const object3d = await parseJSON(jsonObject);
        this.assignPropertyValues(object3d);

        return object3d;
      }
    } catch {
      this.status.next("error");
      throw new Error("Failed to load model");
    }
  }

  private assignPropertyValues(object: THREE.Object3D) {
    const progressStatuses = {
      1: "Not Started",
      2: "In Progress",
      3: "Partially Installed",
      4: "Installed",
    };
    const colors = {
      1: 0xff4444,
      2: 0xff9933,
      3: 0xffeb3b,
      4: 0x4caf50,
    };
    for (const statusCode of Object.keys(progressStatuses)) {
      const code = parseInt(statusCode) as keyof typeof progressStatuses;
      this.highlightMaterials[code] = new THREE.MeshBasicMaterial({
        color: colors[code],
        transparent: true,
        opacity: 0.5,
      });
    }
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const statusIndex = ((child.id % 4) +
          1) as keyof typeof progressStatuses;

        child.userData.propertyValue = {
          statusCode: statusIndex,
          statusText: progressStatuses[statusIndex],
        };
      }
    });
  }

  public highlightObject(object: THREE.Object3D) {
    object.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        this.originalMaterials.set(obj, obj.material);
        obj.material =
          this.highlightMaterials[obj.userData.propertyValue.statusCode];
      }
    });
    const boundingBox = new THREE.Box3().setFromObject(object);
    const boundingSphere = new THREE.Sphere();
    boundingBox.getBoundingSphere(boundingSphere);
    this.cursor.position.x = boundingSphere.center.x;
    this.cursor.position.z = boundingSphere.center.z;
    this.cursor.visible = true;
  }

  public resetObjectHighlight(object: THREE.Object3D) {
    object.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.material = this.originalMaterials.get(obj) ?? obj.material;
      }
    });
    this.cursor.visible = false;
  }

  public highlightObjectByStatus(status: string) {
    this.model.value?.traverse((obj) => {
      if (
        obj instanceof THREE.Mesh &&
        obj.userData.propertyValue.statusText === status
      ) {
        this.originalMaterials.set(obj, obj.material);
        obj.material =
          this.highlightMaterials[obj.userData.propertyValue.statusCode];
      } else {
        this.resetObjectHighlight(obj);
      }
    });
  }

  public dispose() {
    this.world.renderer.dispose();
    this.cameraControl.dispose();
  }
}

export default Viewer;
