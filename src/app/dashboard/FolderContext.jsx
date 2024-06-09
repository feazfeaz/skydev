"use client";
import axios from "axios";
import { createContext, useEffect, useState } from "react";

const FolderContext = createContext({});

export { FolderProvider, FolderContext };

const FolderProvider = ({ children }) => {
  const [folders, setFolders] = useState([]);
  const resetFolders = () => {
    setFolders(new Array(...folders));
  };

  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const response = await axios.get("/api/folder");
        response?.data?.folders?.forEach((folder) => {
          folder.as = generateShortName(folder.path);
        });
        setFolders(response.data.folders);
      } catch (error) {
        console.error("Error fetching folders:", error);
      }
    };

    fetchFolders();
  }, []);

  return (
    <FolderContext.Provider value={{ folders, setFolders, resetFolders }}>
      {children}
    </FolderContext.Provider>
  );
};

function generateShortName(path) {
  const parts = path.split("\\"); // Tách đường dẫn thành các phần
  if (parts.length === 0) return "";

  const lastPart = parts.pop(); // Lấy phần cuối cùng của đường dẫn
  const parentPart = parts.length > 0 ? parts.pop() : ""; // Lấy thư mục cha ngay trước thư mục cuối cùng

  return `@\\${parentPart}\\${lastPart}`; // Ghép các phần lại với nhau
}
