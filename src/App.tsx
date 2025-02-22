import "./App.css";
import Loading from "./components/loading";
import ViewerComponent from "./components/viewer-component";
import ModelHierarchy from "./components/model-hierarchy";

function App() {
  return (
    <>
      <ViewerComponent>
        <Loading />
        <ModelHierarchy />
      </ViewerComponent>
    </>
  );
}

export default App;
