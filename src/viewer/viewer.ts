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

  public status = new RX.BehaviorSubject<ViewerStatus>("idle");

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

    this.world.time.events.on("tick", ({ delta }) => {
      this.cameraControl.update(delta);
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
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const progressStatuses = {
          1: "Not Started",
          2: "In Progress",
          3: "Partially Installed",
          4: "Installed",
        };

        const statusIndex = ((child.id % 4) +
          1) as keyof typeof progressStatuses;
        child.userData.propertyValue = {
          statusCode: statusIndex,
          statusText: progressStatuses[statusIndex],
        };
      }
    });
  }

  public dispose() {
    this.world.renderer.dispose();
    this.cameraControl.dispose();
  }
}

export default Viewer;
