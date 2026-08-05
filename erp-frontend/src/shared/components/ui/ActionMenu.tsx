import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, LucideIcon } from 'lucide-react';

export interface ActionMenuItem {
  label: string;
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}

export interface ActionMenuProps {
  /**
   * Array of menu items to display
   */
  items: ActionMenuItem[];
  
  /**
   * Additional className for the menu trigger button
   */
  className?: string;
  
  /**
   * Additional className for the dropdown menu
   */
  menuClassName?: string;
  
  /**
   * Position of the dropdown menu
   */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

/**
 * ActionMenu - A reusable action menu component with a three-dot icon trigger
 * 
 * @example
 * ```tsx
 * <ActionMenu
 *   items={[
 *     { label: 'View', icon: Eye, onClick: () => handleView() },
 *     { label: 'Edit', icon: Edit, onClick: () => handleEdit() },
 *     { label: 'Delete', icon: Trash2, onClick: () => handleDelete(), variant: 'danger' },
 *   ]}
 * />
 * ```
 */
export const ActionMenu: React.FC<ActionMenuProps> = ({
  items,
  className = '',
  menuClassName = '',
  position = 'bottom-right',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Close on escape key
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setIsOpen(false);
        }
      };
      document.addEventListener('keydown', handleEscape);
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen]);

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'top-full left-0 mt-1';
      case 'top-right':
        return 'bottom-full right-0 mb-1';
      case 'top-left':
        return 'bottom-full left-0 mb-1';
      case 'bottom-right':
      default:
        return 'top-full right-0 mt-1';
    }
  };

  const handleItemClick = (item: ActionMenuItem) => {
    if (!item.disabled) {
      item.onClick();
      setIsOpen(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="relative inline-block">
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`p-1 rounded hover:bg-slate-100 transition-colors text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 ${className}`}
        aria-label="Actions"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          className={`absolute z-50 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 ${getPositionClasses()} ${menuClassName}`}
          role="menu"
        >
          {items.map((item, index) => {
            const IconComponent = item.icon;
            const isDanger = item.variant === 'danger';
            
            return (
              <button
                key={index}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleItemClick(item);
                }}
                disabled={item.disabled}
                className={`
                  w-full px-4 py-2 text-sm text-left flex items-center gap-3
                  transition-colors
                  ${item.disabled 
                    ? 'text-slate-400 cursor-not-allowed' 
                    : isDanger
                    ? 'text-red-600 hover:bg-red-50 hover:text-red-700'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }
                `}
                role="menuitem"
              >
                {IconComponent ? (
                  <IconComponent className={`h-4 w-4 flex-shrink-0 ${item.disabled ? 'opacity-50' : ''}`} />
                ) : (
                  <div className="h-4 w-4 flex-shrink-0" />
                )}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActionMenu;
