"use client";
import axios from "axios";
import { createContext, useEffect, useState } from "react";

const PlayListContext = createContext({});

export { PlayListProvider, PlayListContext };

const PlayListProvider = ({ url, children }) => {
  const [files, setFilesState] = useState([]);

  const setFiles = (files) => {
    setFilesState(new Array(...files));
  };

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await axios({
          method: "get",
          url: "/api/file",
          params: {
            url: url,
          },
        });
        setFiles(response.data.data);
      } catch (error) {
        console.error("Error fetching files:", error);
      }
    };

    fetchFiles();
  }, []);

  return (
    <PlayListContext.Provider value={{ files, setFiles, url }}>
      {children}
    </PlayListContext.Provider>
  );
};
