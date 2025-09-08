import React from 'react';
import './SAPTable.css';

interface SAPTableColumn {
  key: string;
  title: string;
  dataIndex: string;
  render?: (value: any, record: any, index: number) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface SAPTableProps {
  columns: SAPTableColumn[];
  data: any[];
  loading?: boolean;
  emptyText?: string;
  className?: string;
  onRowClick?: (record: any, index: number) => void;
}

export const SAPTable: React.FC<SAPTableProps> = ({
  columns,
  data,
  loading = false,
  emptyText = 'No data available',
  className = '',
  onRowClick
}) => {
  if (loading) {
    return (
      <div className={`sap-table-container ${className}`}>
        <div className="sap-table-loading">
          <div className="sap-table-spinner"></div>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`sap-table-container ${className}`}>
        <div className="sap-table-empty">
          <span>{emptyText}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`sap-table-container ${className}`}>
      <table className="sap-table">
        <thead className="sap-table-header">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="sap-table-header-cell"
                style={{
                  width: column.width,
                  textAlign: column.align || 'left'
                }}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="sap-table-body">
          {data.map((record, index) => (
            <tr
              key={index}
              className={`sap-table-row ${onRowClick ? 'sap-table-row-clickable' : ''}`}
              onClick={() => onRowClick?.(record, index)}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className="sap-table-cell"
                  style={{
                    textAlign: column.align || 'left'
                  }}
                >
                  {column.render
                    ? column.render(record[column.dataIndex], record, index)
                    : record[column.dataIndex]
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
