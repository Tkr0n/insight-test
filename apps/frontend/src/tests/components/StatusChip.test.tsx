import { render, screen } from '@testing-library/react';
import { StatusChip } from '../../components/StatusChip';

describe('StatusChip', () => {
  it('renders the status label', () => {
    render(<StatusChip status="PENDING" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('renders In Progress for IN_PROGRESS status', () => {
    render(<StatusChip status="IN_PROGRESS" />);
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('renders Done for DONE status', () => {
    render(<StatusChip status="DONE" />);
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('renders Archived for ARCHIVED status', () => {
    render(<StatusChip status="ARCHIVED" />);
    expect(screen.getByText('Archived')).toBeInTheDocument();
  });
});
