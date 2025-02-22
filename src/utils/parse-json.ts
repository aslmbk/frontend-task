/* eslint-disable @typescript-eslint/no-explicit-any */
import * as THREE from "three";

export const findThreeJSJSON = (data: any): any | null => {
  try {
    if (typeof data === "object" && data !== null) {
      if (
        data.metadata &&
        typeof data.metadata === "object" &&
        data.metadata.type === "Object" &&
        data.metadata.version &&
        typeof data.metadata.version === "number" &&
        data.metadata.generator &&
        typeof data.metadata.generator === "string" &&
        data.geometries &&
        Array.isArray(data.geometries) &&
        data.materials &&
        Array.isArray(data.materials)
      ) {
        // We've found the Three.js JSON object
        return data;
      } else {
        // Traverse the object recursively to search for the JSON object
        for (const key in data) {
          const result: any = findThreeJSJSON(data[key]);
          if (result) {
            return result;
          }
        }
      }
    }
    // The JSON object was not found in this object or any of its children
    return null;
  } catch (e) {
    console.error("We could not find JSON Object data", e);
  }

  return null;
};

const parseJSON = async (childrenJSON: any): Promise<THREE.Object3D> => {
  const removeTypename = (obj: any) => {
    for (const key in obj) {
      if (key === "__typename") {
        delete obj[key];
      } else if (typeof obj[key] === "object") {
        removeTypename(obj[key]);
      }
    }
  };

  const removeNullValues: any = (obj: any) => {
    if (Array.isArray(obj)) {
      return obj
        .filter((item) => item !== null)
        .map((item: any) =>
          typeof item === "object" ? removeNullValues(item) : item
        );
    } else if (typeof obj === "object") {
      const result: any = {};
      for (const key in obj) {
        if (obj[key] === null) {
          continue;
        }
        if (typeof obj[key] === "object") {
          result[key] = removeNullValues(obj[key]);
        } else {
          result[key] = obj[key];
        }
      }
      return result;
    }
    return obj;
  };

  return new Promise((resolve, reject) => {
    try {
      const loader = new THREE.ObjectLoader();

      // Check if the provided JSON data is an object and has required properties
      if (
        !childrenJSON ||
        typeof childrenJSON !== "object" ||
        !childrenJSON.object
      ) {
        throw new Error("#12362; Invalid JSON data");
      }

      // Remove null values from JSON data
      const cleanedJSON = removeNullValues(childrenJSON);

      // Remove the "__typename" properties from the JSON data
      removeTypename(cleanedJSON);

      // Parse the JSON data into Three.js objects
      const parsed = loader.parse(cleanedJSON);

      resolve(parsed);
    } catch (error) {
      console.error("#932932; Error while parsing JSON data:", error);
      console.error(
        "#230488; Problematic JSON data:",
        JSON.stringify(childrenJSON, null, 2)
      );
      reject(error);
    }
  });
};

export default parseJSON;
