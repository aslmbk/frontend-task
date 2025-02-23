import React, { useEffect, useRef, useState } from "react";
import Viewer from "../viewer/viewer";
import { ViewerContext } from "../hooks";

const ViewerComponent: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer>(null);
  const [viewer, setViewer] = useState<Viewer | null>(null);

  useEffect(() => {
    if (viewerRef.current) {
      onUnmount();
    }
    if (rootRef.current) {
      viewerRef.current = new Viewer(rootRef.current);
      setViewer(viewerRef.current);
    }
    return onUnmount;
  }, []);

  const onUnmount = () => {
    viewerRef.current?.dispose();
    viewerRef.current = null;
    setViewer(null);
  };

  return (
    <div
      ref={rootRef}
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <ViewerContext.Provider value={viewerRef.current}>
        {viewer && children}
      </ViewerContext.Provider>
    </div>
  );
};

export default ViewerComponent;
