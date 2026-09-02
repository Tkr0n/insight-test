import { useState } from 'react';
import { Chip, TextField, Stack } from '@mui/material';

export function TagInput({ value, onChange }: { value: string[]; onChange: (tags: string[]) => void }) {
  const [input, setInput] = useState('');
  const add = () => {
    const v = input.trim();
    if (!v || value.includes(v)) return;
    onChange([...value, v]);
    setInput('');
  };
  const remove = (tag: string) => onChange(value.filter((t) => t !== tag));
  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap' }}>
        {value.map((tag) => (
          <Chip key={tag} label={tag} onDelete={() => remove(tag)} size="small" />
        ))}
      </Stack>
      <TextField
        placeholder="Add tag and press Enter"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            add();
          }
        }}
        size="small"
        fullWidth
      />
    </Stack>
  );
}
