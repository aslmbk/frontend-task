import React, { useState } from "react";
import { useBehaviorSubject } from "../hooks";
import { useViewer } from "../hooks";

interface LegendItem {
  status: string;
  color: string;
}

const legendItems: LegendItem[] = [
  { status: "Not Started", color: "#ff4444" },
  { status: "In Progress", color: "#ff9933" },
  { status: "Partially Installed", color: "#ffeb3b" },
  { status: "Installed", color: "#4caf50" },
];

const Legends: React.FC = () => {
  const viewer = useViewer();
  const model = useBehaviorSubject(viewer.model);

  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const handleLegendClick = (status: string) => {
    if (!model) return;
    if (selectedStatus === status) {
      viewer.resetObjectHighlight(model);
      setSelectedStatus(null);
    } else {
      viewer.highlightObjectByStatus(status);
      setSelectedStatus(status);
    }
  };

  if (!model) {
    return null;
  }

  return (
    <div className="legends">
      {legendItems.map((item) => (
        <div
          key={item.status}
          className={`legends__item ${
            selectedStatus === item.status ? "legends__item--selected" : ""
          }`}
          onClick={() => handleLegendClick(item.status)}
        >
          <div
            className="legends__color-box"
            style={{ backgroundColor: item.color }}
          />
          <span className="legends__text">{item.status}</span>
        </div>
      ))}
    </div>
  );
};

export default Legends;
