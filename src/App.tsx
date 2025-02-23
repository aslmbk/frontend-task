import "./App.css";
import Loading from "./components/loading";
import ViewerComponent from "./components/viewer-component";
import ModelHierarchy from "./components/model-hierarchy";
import Legends from "./components/legends";

function App() {
  return (
    <>
      <ViewerComponent>
        <Loading />
        <ModelHierarchy />
        <Legends />
      </ViewerComponent>
    </>
  );
}

export default App;
