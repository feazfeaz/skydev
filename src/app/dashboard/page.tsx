"use client";
import React, { useContext, useState } from "react";
import { FileTable } from "./FileTable";
import { Container } from "@mui/material";
import { PlayListProvider } from "@/app/dashboard/PlayListContext";
import UpdateButton from "./UpdateButton";
import Folder from "./Folder";

import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import { FolderContext, FolderProvider } from "./FolderContext";
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

function BasicTabs() {
  const [value, setValue] = useState(0);
  const { folders, setFolders } = useContext<any>(FolderContext);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  console.log("folders: ", folders);

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="basic tabs example"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab wrapped label="Quản lý folder" {...a11yProps(0)} />
          <Tab wrapped label="Render" {...a11yProps(1)} />
          {folders &&
            folders.map((folders: { as: any }, index: number) => (
              <Tab wrapped label={`${folders.as}`} {...a11yProps(index + 2)} />
            ))}
        </Tabs>
      </Box>
      <CustomTabPanel value={value} index={0}>
        <Folder />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={1}>
        Em pơ ty
      </CustomTabPanel>

      <CustomTabPanel value={value} index={2}>
        <PlayListProvider>
          <UpdateButton />
          <FileTable />
        </PlayListProvider>
      </CustomTabPanel>
    </Box>
  );
}

const page = () => {
  return (
    <>
      <FolderProvider>
        <BasicTabs />
      </FolderProvider>
    </>
  );
};

export default page;
