import React, { useEffect, useState } from 'react';
import useStore from '../lib/store';
import { Dialog, DialogContent, DialogTitle, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Typography } from '@mui/material';
import { Delete, FolderOpen } from '@mui/icons-material';

export function SavedKitsModal({ open, onClose }) {
    const fetchMyKits = useStore((state) => state.fetchMyKits);
    const myKits = useStore((state) => state.myKits);
    const setKitItems = useStore((state) => state.setKitItems);

    useEffect(() => {
        if (open) {
            fetchMyKits();
        }
    }, [open]);

    const handleLoad = (kit) => {
        setKitItems(kit.items);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle className="font-bold text-slate-800">My Saved Kits</DialogTitle>
            <DialogContent>
                {myKits.length === 0 ? (
                    <Typography className="text-center py-8 text-gray-500">No saved kits found.</Typography>
                ) : (
                    <List>
                        {myKits.map((kit) => (
                            <ListItem key={kit.id} button onClick={() => handleLoad(kit)} className="hover:bg-slate-50 border-b border-gray-100">
                                <ListItemText
                                    primary={kit.name}
                                    secondary={`${new Date(kit.created_at).toLocaleDateString()} - €${kit.total_price}`}
                                />
                                <ListItemSecondaryAction>
                                    <IconButton edge="end" aria-label="load" onClick={() => handleLoad(kit)}>
                                        <FolderOpen className="text-teal" />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                )}
            </DialogContent>
        </Dialog>
    );
}
