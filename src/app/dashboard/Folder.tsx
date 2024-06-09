"use client";
// pages/index.js
import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  Box,
} from "@mui/material";
import { FolderContext } from "./FolderContext";

const Folder = () => {
  const { folders, setFolders } = useContext<any>(FolderContext);

  const [newFolderPath, setNewFolderPath] = useState("");

  const handleAddFolder = async () => {
    try {
      if (!newFolderPath) {
        return;
      }

      folders.push({ id: 0, path: newFolderPath });
      const response = await axios.post("/api/folder", {
        folders,
      });
      response?.data?.data?.forEach((folder: any) => {
        folder.as = generateShortName(folder.path);
      });
      setFolders(response.data.data || []);
    } catch (error) {
      console.error("Error adding folder:", error);
    }
  };

  const handleRemoveFolder = async (id: any) => {
    try {
      const result = folders.filter((folder: any) => {
        return folder.id != id;
      });

      const response = await axios.post("/api/folder", {
        folders: result,
      });
      response?.data?.data?.forEach((folder: any) => {
        folder.as = generateShortName(folder.path);
      });
      setFolders(response.data.data || []);
    } catch (error) {
      console.error("Error removing folder:", error);
    }
  };

  return (
    <Box p={2}>
      <Box mb={2}>
        <TextField
          label="New Folder Path"
          variant="outlined"
          value={newFolderPath}
          size="small"
          sx={{ width: "450px" }}
          onChange={(e) => setNewFolderPath(e.target.value)}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleAddFolder}
          style={{ marginLeft: "10px" }}
        >
          Add Folder
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {/* <TableCell>ID</TableCell> */}
              <TableCell>Path</TableCell>
              <TableCell>As</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {folders.map((folder: any) => (
              <TableRow key={folder.id}>
                {/* <TableCell>{folder.id}</TableCell> */}
                <TableCell>{folder.path}</TableCell>
                <TableCell>{folder.as || ""}</TableCell>
                <TableCell align="right">
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => handleRemoveFolder(folder.id)}
                  >
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Folder;

function generateShortName(path: string) {
  const parts = path.split("\\"); // Tách đường dẫn thành các phần
  if (parts.length === 0) return "";

  const lastPart = parts.pop(); // Lấy phần cuối cùng của đường dẫn
  const parentPart = parts.length > 0 ? parts.pop() : ""; // Lấy thư mục cha ngay trước thư mục cuối cùng

  return `@\\${parentPart}\\${lastPart}`; // Ghép các phần lại với nhau
}
