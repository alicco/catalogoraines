import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, TextField, Button, Alert } from '@mui/material';
import useStore from '../lib/store';

export function AuthModal({ open, onClose }) {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const signIn = useStore((state) => state.signIn);
    const signUp = useStore((state) => state.signUp);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            if (isSignUp) {
                await signUp(email, password);
                alert('Registrazione completata! Controlla la tua email per confermare.');
                onClose();
            } else {
                await signIn(email, password);
                onClose();
            }
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle className="text-center font-bold text-slate-800">
                {isSignUp ? 'Create Account' : 'Welcome Back'}
            </DialogTitle>
            <DialogContent>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
                    {error && <Alert severity="error">{error}</Alert>}

                    <TextField
                        label="Email"
                        type="email"
                        fullWidth
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        variant="outlined"
                    />
                    <TextField
                        label="Password"
                        type="password"
                        fullWidth
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        variant="outlined"
                    />

                    <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        sx={{ backgroundColor: '#2a8a88', '&:hover': { backgroundColor: '#237a78' }, py: 1.5 }}
                    >
                        {isSignUp ? 'Sign Up' : 'Log In'}
                    </Button>

                    <div className="text-center mt-2">
                        <span className="text-sm text-gray-600">
                            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                        </span>
                        <Button
                            variant="text"
                            onClick={() => setIsSignUp(!isSignUp)}
                            sx={{ textTransform: 'none', fontWeight: 'bold' }}
                        >
                            {isSignUp ? 'Log In' : 'Sign Up'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
