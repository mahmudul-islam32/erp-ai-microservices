import React, { useMemo } from 'react';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { ActionMenu, ActionMenuItem } from './ActionMenu';

export interface TableActionButtonsProps {
  /**
   * Callback when view button is clicked
   */
  onView?: () => void;
  
  /**
   * Callback when edit button is clicked
   */
  onEdit?: () => void;
  
  /**
   * Callback when delete button is clicked
   */
  onDelete?: () => void;
  
  /**
   * Whether to show the view button (default: true)
   */
  showView?: boolean;
  
  /**
   * Whether to show the edit button (default: true if onEdit is provided)
   */
  showEdit?: boolean;
  
  /**
   * Whether to show the delete button (default: true if onDelete is provided)
   */
  showDelete?: boolean;
  
  /**
   * Custom labels for menu items
   */
  viewLabel?: string;
  editLabel?: string;
  deleteLabel?: string;
  
  /**
   * Additional className for the container
   */
  className?: string;
  
  /**
   * Position of the dropdown menu
   */
  menuPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

/**
 * Reusable table action buttons component for view, edit, and delete actions
 * Uses a three-dot menu design with dropdown
 * 
 * @example
 * ```tsx
 * <TableActionButtons
 *   onView={() => handleView(item)}
 *   onEdit={() => handleEdit(item)}
 *   onDelete={() => handleDelete(item)}
 *   showEdit={canEdit}
 *   showDelete={canDelete}
 * />
 * ```
 */
export const TableActionButtons: React.FC<TableActionButtonsProps> = ({
  onView,
  onEdit,
  onDelete,
  showView = true,
  showEdit = !!onEdit,
  showDelete = !!onDelete,
  viewLabel = 'View Details',
  editLabel = 'Edit',
  deleteLabel = 'Delete',
  className = '',
  menuPosition = 'bottom-right',
}) => {
  const menuItems = useMemo<ActionMenuItem[]>(() => {
    const items: ActionMenuItem[] = [];
    
    if (showView && onView) {
      items.push({
        label: viewLabel,
        icon: Eye,
        onClick: onView,
      });
    }
    
    if (showEdit && onEdit) {
      items.push({
        label: editLabel,
        icon: Edit,
        onClick: onEdit,
      });
    }
    
    if (showDelete && onDelete) {
      items.push({
        label: deleteLabel,
        icon: Trash2,
        onClick: onDelete,
        variant: 'danger',
      });
    }
    
    return items;
  }, [showView, showEdit, showDelete, onView, onEdit, onDelete, viewLabel, editLabel, deleteLabel]);

  if (menuItems.length === 0) {
    return null;
  }

  return (
    <ActionMenu
      items={menuItems}
      className={className}
      position={menuPosition}
    />
  );
};

export default TableActionButtons;

