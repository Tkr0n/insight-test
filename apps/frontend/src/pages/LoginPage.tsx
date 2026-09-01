import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Stack,
  Alert,
} from '@mui/material';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(
        `https://cognito-idp.${import.meta.env.VITE_AWS_REGION}.amazonaws.com/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-amz-json-1.1' },
          body: JSON.stringify({
            AuthParameters: {
              USERNAME: email,
              PASSWORD: password,
            },
            AuthFlow: 'USER_PASSWORD_AUTH',
            ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
          }),
        }
      );

      const data = (await response.json()) as {
        AuthenticationResult?: { IdToken: string };
        message?: string;
        __type?: string;
      };

      if (data.AuthenticationResult?.IdToken) {
        localStorage.setItem('id_token', data.AuthenticationResult.IdToken);
        navigate('/tasks', { replace: true });
      } else {
        const cognitoErrors: Record<string, string> = {
          UserNotFoundException: 'No account found with this email.',
          NotAuthorizedException: 'Incorrect email or password.',
          UserNotConfirmedException: 'Please confirm your account first.',
          LimitExceededException: 'Too many attempts. Please try again later.',
        };
        setError(cognitoErrors[data.__type ?? ''] ?? data.message ?? 'Invalid credentials');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: 'grey.100',
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 400 }}>
        <CardContent>
          <Typography variant="h5" align="center" gutterBottom>
            Insightt Task Manager
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
            Sign in to manage your tasks
          </Typography>
          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
                autoFocus
              />
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
