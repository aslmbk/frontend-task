import { useEffect, useState } from "react";
import { useViewer, useBehaviorSubject } from "../hooks";
import * as THREE from "three";

interface HierarchyItemProps {
  object: THREE.Object3D;
  onSelect: (obj: THREE.Object3D) => void;
  selectedObject: THREE.Object3D | null;
}

const HierarchyItem: React.FC<HierarchyItemProps> = ({
  object,
  onSelect,
  selectedObject,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const isSelected =
    selectedObject &&
    (object === selectedObject || selectedObject.getObjectById(object.id));

  const isChildrenSelected =
    selectedObject && object.getObjectById(selectedObject.id);

  return (
    <div className="hierarchy-item">
      <div
        className={`hierarchy-item__content ${
          isSelected ? "hierarchy-item__content--selected" : ""
        } ${
          isChildrenSelected ? "hierarchy-item__content--children-selected" : ""
        }`}
      >
        {object.children.length > 0 && (
          <span
            onClick={() => setIsExpanded(!isExpanded)}
            className="hierarchy-item__expand-button"
          >
            {isExpanded ? "▼" : "►"}
          </span>
        )}
        <div onClick={() => onSelect(object)}>{object.userData.name}</div>
      </div>

      {isExpanded &&
        object.children.map((child, index) => (
          <HierarchyItem
            key={index}
            object={child}
            onSelect={onSelect}
            selectedObject={selectedObject}
          />
        ))}
    </div>
  );
};

const ModelHierarchy: React.FC = () => {
  const viewer = useViewer();
  const model = useBehaviorSubject(viewer.model);
  const [selectedObject, setSelectedObject] = useState<THREE.Object3D | null>(
    null
  );
  const [highlightMaterial] = useState(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xffeb3b,
        transparent: true,
        opacity: 0.3,
      })
  );

  useEffect(() => {
    if (selectedObject) {
      const originalMaterials = new Map();

      selectedObject.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          originalMaterials.set(obj, obj.material);
          obj.material = highlightMaterial;
        }
      });

      return () => {
        selectedObject.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.material = originalMaterials.get(obj);
          }
        });
      };
    }
  }, [selectedObject, highlightMaterial]);

  const handleSelect = (object: THREE.Object3D) => {
    if (object.id === selectedObject?.id) {
      setSelectedObject(null);
    } else {
      setSelectedObject(object);
    }
  };

  if (!model) {
    return null;
  }

  model.userData.name = "Конструкция";

  return (
    <div className="model-hierarchy">
      <h3 className="model-hierarchy__title">Конструкция</h3>
      <HierarchyItem
        object={model}
        onSelect={handleSelect}
        selectedObject={selectedObject}
      />
    </div>
  );
};

export default ModelHierarchy;
