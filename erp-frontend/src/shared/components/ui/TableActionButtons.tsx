import React from 'react';
import { Button } from './Button';
import { Icon } from './Icon';

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
   * Custom labels for tooltips
   */
  viewLabel?: string;
  editLabel?: string;
  deleteLabel?: string;
  
  /**
   * Additional className for the container
   */
  className?: string;
}

/**
 * Reusable table action buttons component for view, edit, and delete actions
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
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* View Button */}
      {showView && onView && (
        <Button
          shape="icon"
          variant="tertiary"
          size="small"
          onClick={onView}
          title={viewLabel}
          aria-label={viewLabel}
        >
          <Icon name="eye" />
        </Button>
      )}

      {/* Edit Button */}
      {showEdit && onEdit && (
        <Button
          shape="icon"
          variant="primary"
          size="small"
          onClick={onEdit}
          title={editLabel}
          aria-label={editLabel}
        >
          <Icon name="edit" color="white" />
        </Button>
      )}

      {/* Delete Button */}
      {showDelete && onDelete && (
        <Button
          shape="icon"
          variant="danger"
          size="small"
          onClick={onDelete}
          title={deleteLabel}
          aria-label={deleteLabel}
        >
          <Icon name="trash" color="white" />
        </Button>
      )}
    </div>
  );
};

export default TableActionButtons;

