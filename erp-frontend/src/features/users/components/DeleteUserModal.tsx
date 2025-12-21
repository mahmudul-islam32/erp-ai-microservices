import React from 'react';
import { User } from '../types';
import { DeleteConfirmationModal } from '../../../shared/components/ui/DeleteConfirmationModal';

interface DeleteUserModalProps {
  user: User;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  user,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const userName = `${user.first_name} ${user.last_name}`.trim() || user.email;
  const displayName = userName !== user.email ? `${userName} (${user.email})` : user.email;

  return (
    <DeleteConfirmationModal
      isOpen={true}
      onClose={onCancel}
      onConfirm={onConfirm}
      title="Delete User"
      message="Are you sure you want to delete"
      itemName={displayName}
      loading={loading}
    />
  );
};

