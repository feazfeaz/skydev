"use client";

// pages/index.js
import React, { useContext, useEffect, useState } from "react";
import { Button, IconButton, TableSortLabel } from "@mui/material";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Icon,
} from "@mui/material";

import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import { PlayListContext } from "./PlayListContext";

const FileTable = () => {
  const { files, setFiles } = useContext<any>(PlayListContext);

  const handleStarBtnClick = (index: any) => {
    files[Number(index)].isPriority = !files[Number(index)].isPriority;
    files[Number(index)].isTrash = files[Number(index)].isPriority
      ? false
      : files[Number(index)].isTrash;
    setFiles(files);
  };

  const handleTrashBtnClick = (index: any) => {
    files[Number(index)].isTrash = !files[Number(index)].isTrash;
    files[Number(index)].isPriority = !files[Number(index)].isTrash
      ? files[Number(index)].isPriority
      : false;
    setFiles(files);
  };

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel active={true} direction={"desc"}>
                  Name
                </TableSortLabel>
              </TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>In Use</TableCell>
              <TableCell>Duration</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {files.map((file: any, index: React.Key | null | undefined) => (
              <TableRow
                key={index}
                style={{ backgroundColor: file.isTrash ? "#f0f0f0" : "white" }}
              >
                <TableCell>{file.name}</TableCell>
                <TableCell>{file.type}</TableCell>
                <TableCell>
                  <IconButton
                    aria-label="Example"
                    onClick={() => {
                      handleStarBtnClick(index);
                    }}
                  >
                    {file.isPriority ? (
                      <StarIcon style={{ color: "gold" }} />
                    ) : (
                      <StarBorderIcon />
                    )}
                  </IconButton>
                </TableCell>
                <TableCell>
                  <Button
                    onClick={() => {
                      handleTrashBtnClick(index);
                    }}
                  >
                    {!file.isTrash ? "Yes" : "No"}
                  </Button>
                </TableCell>
                <TableCell>{file.durationFormat}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

export { FileTable };
