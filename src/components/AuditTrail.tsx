import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Alert,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";

const AuditTrail: React.FC = () => {
  const [auditTrail, setAuditTrail] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("dualSignAuditTrail") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const sync = () => {
      try {
        setAuditTrail(
          JSON.parse(localStorage.getItem("dualSignAuditTrail") || "[]")
        );
      } catch {
        setAuditTrail([]);
      }
    };
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  return (
    <Box maxWidth={700} mx="auto" my={6} p={3} component={Paper} elevation={3}>
      <Typography variant="h4" align="center" gutterBottom>
        Audit Trail
      </Typography>
      {auditTrail.length === 0 ? (
        <Alert severity="info">No audit events yet.</Alert>
      ) : (
        <List>
          {auditTrail.map((entry, idx) => (
            <ListItem key={idx} divider>
              <ListItemText
                primary={`${entry.timestamp} - ${entry.user} - ${entry.action}`}
                secondary={JSON.stringify(entry.details)}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default AuditTrail;
