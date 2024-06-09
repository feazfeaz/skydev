"use client";
import axios from "axios";
import { createContext, useEffect, useState } from "react";

const PlayListContext = createContext({});

export { PlayListProvider, PlayListContext };

const PlayListProvider = ({ children }) => {
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
            url1: "C:\\Eaz\\re\\pjs\\lab\\storage\\instru",
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
    <PlayListContext.Provider value={{ files, setFiles }}>
      {children}
    </PlayListContext.Provider>
  );
};
