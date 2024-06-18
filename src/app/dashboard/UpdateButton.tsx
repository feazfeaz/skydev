import { Button } from "@mui/material";
import React, { useContext } from "react";
import { PlayListContext } from "./PlayListContext";
import axios from "axios";

const UpdateButton = () => {
  const { files, setFiles, url } = useContext<any>(PlayListContext);

  const handleUpdateClickBtn = async () => {
    const response = await axios({
      method: "POST",
      url: "/api/file",
      data: {
        url: url,
        files: files,
      },
    });

    console.log("response: ", response);
  };

  return (
    <>
      <Button onClick={handleUpdateClickBtn} variant="contained">
        Update
      </Button>
    </>
  );
};

export default UpdateButton;
